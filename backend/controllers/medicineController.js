const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csvParser = require('csv-parser');
const Medicine = require('../models/Medicine');
const SearchLog = require('../models/SearchLog');
const mockDb = require('../utils/mockDb');

// RAG service url from env
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5001';

// @desc    Get all medicines (with pagination, search, category filters)
// @route   GET /api/medicine
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const skip = (page - 1) * limit;

    let medicinesList = [];
    let total = 0;

    if (process.env.MONGO_CONNECTED === 'true') {
      const query = {};
      
      if (search) {
        query.$or = [
          { Medicine_Name: { $regex: search, $options: 'i' } },
          { Brand: { $regex: search, $options: 'i' } },
          { Generic_Name: { $regex: search, $options: 'i' } }
        ];
      }

      if (category) {
        query.Category = category;
      }

      total = await Medicine.countDocuments(query);
      medicinesList = await Medicine.find(query)
        .sort({ Medicine_Name: 1 })
        .skip(skip)
        .limit(Number(limit));
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
      medicinesList = temp.slice(skip, skip + Number(limit));
    }

    res.status(200).json({
      success: true,
      data: medicinesList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
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
      // Map candidates to our frontend structure
      alternatives = response.data.approximateGroup.candidate.map(item => ({
        Medicine_Name: item.name,
        rxcui: item.rxcui,
        score: item.score
      }));
    }

    // Since RxNorm is an autocomplete API, we just return the alternatives list as "foundMedicine" if there's an exact top match, 
    // or just return the alternatives.
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

    // Call OpenFDA API
    // Search by generic name or brand name
    let url = `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${encodeURIComponent(drugName)}"+OR+openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
    
    // Add API key if provided in .env to increase rate limits (240 requests/min vs 40 requests/min)
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

    // Parse local CSV
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Clean and prepare columns
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
          // 1. Save to MongoDB if connected
          if (process.env.MONGO_CONNECTED === 'true') {
            for (const item of parsedMedicines) {
              await Medicine.findOneAndUpdate(
                { Medicine_ID: item.Medicine_ID },
                item,
                { upsert: true, new: true }
              );
            }
          }

          // 2. Also update mock memory store
          for (const item of parsedMedicines) {
            mockDb.saveMockMedicine(item);
          }

          // 3. Trigger Flask RAG vector database ingestion
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
            count: parsedMedicines.length,
            ragSynced: ragSuccess,
            message: `Successfully processed ${parsedMedicines.length} medicine records. ${ragMessage}`
          });
        } catch (dbErr) {
          console.error(dbErr);
          res.status(500).json({ success: false, error: 'Database seeding failed: ' + dbErr.message });
        }
      });
  } catch (error) {
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

    if (process.env.MONGO_CONNECTED === 'true') {
      updatedRecord = await Medicine.findOneAndUpdate(
        { Medicine_ID },
        req.body,
        { new: true }
      );
    }

    // Also update mock memory store
    updatedRecord = mockDb.saveMockMedicine(req.body);

    // Sync with vector DB by doing a full ingest of current catalog
    // Write out the current inventory to CSV to re-ingest
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

    if (process.env.MONGO_CONNECTED === 'true') {
      const resVal = await Medicine.deleteOne({ Medicine_ID });
      deletedCount = resVal.deletedCount;
    }

    // Also delete from mock database
    const mockDel = mockDb.deleteMockMedicine(Medicine_ID);
    if (mockDel) deletedCount = 1;

    if (deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Medicine not found' });
    }

    // Sync RAG
    syncCatalogToRAG();

    res.status(200).json({
      success: true,
      message: `Medicine with ID ${Medicine_ID} deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper utility to keep vector DB in sync after edits
const syncCatalogToRAG = async () => {
  try {
    // Fetch all current medicines
    let list = [];
    if (process.env.MONGO_CONNECTED === 'true') {
      list = await Medicine.find({});
    } else {
      list = mockDb.getMockMedicines();
    }

    // Write to our main CSV seed
    const csvPath = path.join(__dirname, '..', 'csv', 'medicines.csv');
    const csvWriter = require('fs').createWriteStream(csvPath);
    
    // Write headers
    csvWriter.write('Medicine_ID,Medicine_Name,Brand,Generic_Name,Strength,Use_Case,Alternative,Stock,Price,Manufacturer,Dosage,Morning,Afternoon,Night,BeforeFood,AfterFood,SideEffects,Warnings,Expiry,Category\n');
    
    for (const m of list) {
      const line = `"${m.Medicine_ID}","${m.Medicine_Name}","${m.Brand}","${m.Generic_Name}","${m.Strength}","${m.Use_Case}","${m.Alternative}",${m.Stock},${m.Price},"${m.Manufacturer}","${m.Dosage}","${m.Morning}","${m.Afternoon}","${m.Night}",${m.BeforeFood},${m.AfterFood},"${m.SideEffects}","${m.Warnings}","${m.Expiry}","${m.Category}"\n`;
      csvWriter.write(line);
    }
    
    csvWriter.end();

    // Trigger RAG Ingestion on Python Service
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
    const Interaction = require('../models/Interaction');

    for (let i = 0; i < cleanNames.length; i++) {
      for (let j = i + 1; j < cleanNames.length; j++) {
        // Simple helper to isolate drug name from strengths (e.g. "Ibuprofen 400mg" -> "ibuprofen")
        const drugAWord = cleanNames[i].split(' ')[0];
        const drugBWord = cleanNames[j].split(' ')[0];

        let match = null;
        if (process.env.MONGO_CONNECTED === 'true') {
          match = await Interaction.findOne({
            $or: [
              { drugA: drugAWord, drugB: drugBWord },
              { drugA: drugBWord, drugB: drugAWord }
            ]
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
  uploadMedicinesCsv,
  updateMedicine,
  deleteMedicine,
  checkInteractions,
  getFDAData
};
