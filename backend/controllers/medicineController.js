const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csvParser = require('csv-parser');
const { prisma } = require('../config/db');
const mockDb = require('../utils/mockDb');

// RAG service url from env
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5001';

// @desc    Get all medicines (with pagination, search, category filters)
// @route   GET /api/medicine
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let medicinesList = [];
    let total = 0;

    if (process.env.DB_CONNECTED === 'true') {
      const whereClause = {};
      
      if (search) {
        whereClause.OR = [
          { Medicine_Name: { contains: search, mode: 'insensitive' } },
          { Brand: { contains: search, mode: 'insensitive' } },
          { Generic_Name: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (category) {
        whereClause.Category = category;
      }

      total = await prisma.medicine.count({ where: whereClause });
      medicinesList = await prisma.medicine.findMany({
        where: whereClause,
        orderBy: { Medicine_Name: 'asc' },
        skip,
        take
      });
    } else {
      // Mock db implementation
      let temp = mockDb.getMockMedicines();

      if (search) {
        const lowerSearch = search.toLowerCase();
        temp = temp.filter(m => 
          m.Medicine_Name.toLowerCase().includes(lowerSearch) ||
          m.Brand.toLowerCase().includes(lowerSearch) ||
          m.Generic_Name.toLowerCase().includes(lowerSearch)
        );
      }

      if (category) {
        temp = temp.filter(m => m.Category === category);
      }

      total = temp.length;
      medicinesList = temp.slice(skip, skip + take);
    }

    res.status(200).json({
      success: true,
      data: medicinesList,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Search medicine using RxNorm API (National Library of Medicine)
// @route   GET /api/medicine/search
// @access  Private
const searchMedicine = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    // Call RxNorm API
    const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/Prescribe/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=10`);
    
    let alternatives = [];
    if (response.data && response.data.approximateGroup && response.data.approximateGroup.candidate) {
      alternatives = response.data.approximateGroup.candidate.map(item => ({
        Medicine_Name: item.name,
        rxcui: item.rxcui,
        score: item.score
      }));
    }

    let foundMedicine = null;
    if (alternatives.length > 0) {
      foundMedicine = {
        Medicine_Name: alternatives[0].Medicine_Name,
        source: 'RxNorm API'
      };
    }

    res.status(200).json({
      success: true,
      found: foundMedicine !== null,
      data: foundMedicine,
      alternatives: alternatives.slice(0, 5) // Return top 5
    });
  } catch (error) {
    console.error('RxNorm Search Error:', error);
    res.status(500).json({ success: false, error: 'Failed to reach RxNorm database.' });
  }
};

// @desc    Get real FDA Drug Label Data (Black Box Warnings, Indications)
// @route   GET /api/medicine/fda/:drugName
// @access  Private
const getFDAData = async (req, res) => {
  try {
    const { drugName } = req.params;
    
    if (!drugName) {
      return res.status(400).json({ success: false, error: 'Drug name is required' });
    }

    let url = `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodeURIComponent(drugName)}"+OR+openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
    
    if (process.env.OPENFDA_API_KEY) {
      url += `&api_key=${process.env.OPENFDA_API_KEY}`;
    }
    
    const response = await axios.get(url);

    if (response.data && response.data.results && response.data.results.length > 0) {
      const fdaData = response.data.results[0];
      
      const clinicalData = {
        brandName: fdaData.openfda?.brand_name?.[0] || drugName,
        genericName: fdaData.openfda?.substance_name?.[0] || 'Unknown',
        manufacturer: fdaData.openfda?.manufacturer_name?.[0] || 'Unknown',
        indications: fdaData.indications_and_usage ? fdaData.indications_and_usage[0] : 'No indication data provided by FDA.',
        warnings: fdaData.warnings ? fdaData.warnings[0] : 'No warnings listed.',
        boxedWarning: fdaData.boxed_warning ? fdaData.boxed_warning[0] : null,
        adverseReactions: fdaData.adverse_reactions ? fdaData.adverse_reactions[0] : 'No adverse reactions listed.',
        route: fdaData.openfda?.route?.[0] || 'Oral'
      };

      return res.status(200).json({ success: true, data: clinicalData });
    }

    res.status(404).json({ success: false, error: 'No FDA label data found for this drug.' });
  } catch (error) {
    console.error('OpenFDA Error:', error);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ success: false, error: 'No FDA label data found for this drug.' });
    }
    res.status(500).json({ success: false, error: 'Failed to reach FDA servers.' });
  }
};

// @desc    Upload CSV to seed inventory & ingest into RAG vector store
// @route   POST /api/medicine/upload
// @access  Private (Pharmacist / Admin)
const uploadMedicinesCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a CSV file' });
    }

    const csvFilePath = req.file.path;
    const parsedMedicines = [];

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.Medicine_Name) {
          parsedMedicines.push({
            Medicine_ID: row.Medicine_ID || `MED${Date.now()}_${parsedMedicines.length}`,
            Medicine_Name: row.Medicine_Name,
            Brand: row.Brand || '',
            Generic_Name: row.Generic_Name || '',
            Strength: row.Strength || '',
            Use_Case: row.Use_Case || '',
            Alternative: row.Alternative || '',
            Stock: parseInt(row.Stock) || 0,
            Price: parseFloat(row.Price) || 0.0,
            Manufacturer: row.Manufacturer || '',
            Dosage: row.Dosage || '',
            Morning: row.Morning || '0',
            Afternoon: row.Afternoon || '0',
            Night: row.Night || '0',
            BeforeFood: String(row.BeforeFood).toLowerCase() === 'true',
            AfterFood: String(row.AfterFood).toLowerCase() === 'true',
            SideEffects: row.SideEffects || '',
            Warnings: row.Warnings || '',
            Expiry: row.Expiry || '',
            Category: row.Category || ''
          });
        }
      })
      .on('end', async () => {
        try {
          if (process.env.DB_CONNECTED === 'true') {
            for (const item of parsedMedicines) {
              await prisma.medicine.upsert({
                where: { Medicine_ID: item.Medicine_ID },
                update: item,
                create: item
              });
            }
          }

          for (const item of parsedMedicines) {
            mockDb.saveMockMedicine(item);
          }

          let ragSuccess = false;
          let ragMessage = '';
          
          try {
            const ragRes = await axios.post(`${RAG_SERVICE_URL}/api/rag/ingest`, {
              csv_path: csvFilePath
            });
            if (ragRes.data && ragRes.data.success) {
              ragSuccess = true;
              ragMessage = ragRes.data.message;
            }
          } catch (err) {
            console.error('Failed to sync CSV with Python RAG service:', err.message);
            ragMessage = 'Vector database sync failed, but catalog database was seeded.';
          }

          res.status(200).json({ 
            success: true, 
            message: `Successfully uploaded ${parsedMedicines.length} medicines.`,
            rag_status: { success: ragSuccess, message: ragMessage }
          });
        } catch (dbError) {
          console.error('Database Sync Error:', dbError);
          res.status(500).json({ success: false, error: 'Failed to save parsed data to DB' });
        }
      });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// @desc    Update single medicine details
// @route   PUT /api/medicine/update
// @access  Private (Pharmacist / Admin)
const updateMedicine = async (req, res) => {
  try {
    const { Medicine_ID } = req.body;

    if (!Medicine_ID) {
      return res.status(400).json({ success: false, error: 'Medicine_ID is required to identify records' });
    }

    let updatedRecord = null;

    if (process.env.DB_CONNECTED === 'true') {
      try {
        updatedRecord = await prisma.medicine.update({
          where: { Medicine_ID },
          data: req.body
        });
      } catch (err) {
        if (err.code === 'P2025') updatedRecord = null;
        else throw err;
      }
    }

    updatedRecord = mockDb.saveMockMedicine(req.body);
    syncCatalogToRAG();

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicine/delete
// @access  Private (Admin)
const deleteMedicine = async (req, res) => {
  try {
    const { Medicine_ID } = req.body;

    if (!Medicine_ID) {
      return res.status(400).json({ success: false, error: 'Medicine_ID is required' });
    }

    let deletedCount = 0;

    if (process.env.DB_CONNECTED === 'true') {
      try {
        await prisma.medicine.delete({
          where: { Medicine_ID }
        });
        deletedCount = 1;
      } catch (err) {
        if (err.code === 'P2025') deletedCount = 0;
        else throw err;
      }
    }

    const mockDel = mockDb.deleteMockMedicine(Medicine_ID);
    if (mockDel) deletedCount = 1;

    if (deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    syncCatalogToRAG();

    res.status(200).json({
      success: true,
      message: `Medicine with ID ${Medicine_ID} deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const syncCatalogToRAG = async () => {
  try {
    let list = [];
    if (process.env.DB_CONNECTED === 'true') {
      list = await prisma.medicine.findMany({});
    } else {
      list = mockDb.getMockMedicines();
    }

    const csvPath = path.join(__dirname, '..', 'csv', 'medicines.csv');
    const csvWriter = require('fs').createWriteStream(csvPath);
    
    csvWriter.write('Medicine_ID,Medicine_Name,Brand,Generic_Name,Strength,Use_Case,Alternative,Stock,Price,Manufacturer,Dosage,Morning,Afternoon,Night,BeforeFood,AfterFood,SideEffects,Warnings,Expiry,Category\n');
    
    for (const m of list) {
      const line = `"${m.Medicine_ID}","${m.Medicine_Name}","${m.Brand}","${m.Generic_Name}","${m.Strength}","${m.Use_Case}","${m.Alternative}",${m.Stock},${m.Price},"${m.Manufacturer}","${m.Dosage}","${m.Morning}","${m.Afternoon}","${m.Night}",${m.BeforeFood},${m.AfterFood},"${m.SideEffects}","${m.Warnings}","${m.Expiry}","${m.Category}"\n`;
      csvWriter.write(line);
    }
    
    csvWriter.end();

    await axios.post(`${RAG_SERVICE_URL}/api/rag/ingest`, {
      csv_path: csvPath
    });
    console.log('Synchronized vector database after manual inventory edit.');
  } catch (err) {
    console.warn('RAG service sync failed in edit handler:', err.message);
  }
};

// @desc    Check drug-drug interactions for a list of medicine names
// @route   POST /api/medicine/interaction-check
// @access  Private
const checkInteractions = async (req, res) => {
  try {
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return res.status(400).json({ success: false, error: 'At least two medicines are required for interaction checking' });
    }

    const cleanNames = medicines.map(name => name.trim().toLowerCase());
    const interactionWarnings = [];

    for (let i = 0; i < cleanNames.length; i++) {
      for (let j = i + 1; j < cleanNames.length; j++) {
        const drugAWord = cleanNames[i].split(' ')[0];
        const drugBWord = cleanNames[j].split(' ')[0];

        let match = null;
        if (process.env.DB_CONNECTED === 'true') {
          match = await prisma.interaction.findFirst({
            where: {
              OR: [
                { drugA: drugAWord, drugB: drugBWord },
                { drugA: drugBWord, drugB: drugAWord }
              ]
            }
          });
        } else {
          match = mockDb.getMockInteractions().find(item => 
            (item.drugA === drugAWord && item.drugB === drugBWord) ||
            (item.drugA === drugBWord && item.drugB === drugAWord)
          );
        }

        if (match) {
          interactionWarnings.push({
            drugA: medicines[i],
            drugB: medicines[j],
            severity: match.severity,
            description: match.description
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      hasInteractions: interactionWarnings.length > 0,
      warnings: interactionWarnings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMedicines,
  searchMedicine,
  getFDAData,
  uploadMedicinesCsv,
  updateMedicine,
  deleteMedicine,
  checkInteractions
};
