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

// @desc    Search medicine using DB and RAG fallback
// @route   GET /api/medicine/search
// @access  Private
const searchMedicine = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    let foundMedicine = null;
    let alternatives = [];
    const queryLower = query.toLowerCase();

    // 1. Check local catalog first
    if (process.env.MONGO_CONNECTED === 'true') {
      foundMedicine = await Medicine.findOne({
        $or: [
          { Medicine_Name: { $regex: query, $options: 'i' } },
          { Brand: { $regex: query, $options: 'i' } },
          { Generic_Name: { $regex: query, $options: 'i' } }
        ]
      });
    } else {
      foundMedicine = mockDb.getMockMedicines().find(m => 
        m.Medicine_Name.toLowerCase().includes(queryLower) ||
        m.Brand.toLowerCase().includes(queryLower) ||
        m.Generic_Name.toLowerCase().includes(queryLower)
      );
    }

    // 2. Log searches for analytics
    const logData = {
      query,
      userId: req.user ? req.user._id || req.user.id : null,
      userRole: req.user ? req.user.role : 'Guest',
      wasFound: !!foundMedicine,
      medicineName: foundMedicine ? foundMedicine.Medicine_Name : '',
      alternativesSuggested: []
    };

    // 3. Handle stock availability / alternatives suggestion
    if (foundMedicine) {
      if (foundMedicine.Stock === 0) {
        // Out of stock! Suggest alternatives
        const altName = foundMedicine.Alternative;
        logData.alternativesSuggested.push(altName);
        
        // Find alternative details
        let altDetails = null;
        if (process.env.MONGO_CONNECTED === 'true') {
          altDetails = await Medicine.findOne({
            $or: [
              { Medicine_Name: { $regex: altName, $options: 'i' } },
              { Brand: { $regex: altName, $options: 'i' } }
            ]
          });
        } else {
          const lowerAlt = altName.toLowerCase();
          altDetails = mockDb.getMockMedicines().find(m => 
            m.Medicine_Name.toLowerCase().includes(lowerAlt) ||
            m.Brand.toLowerCase().includes(lowerAlt)
          );
        }
        
        alternatives = altDetails ? [altDetails] : [{ Medicine_Name: altName, Note: 'Details not in catalog but recommended generically.' }];
      }
    } else {
      // Not found in DB, query the RAG vector service to find the closest match semantically!
      try {
        const ragRes = await axios.post(`${RAG_SERVICE_URL}/api/rag/query`, {
          query: query,
          top_k: 2
        });
        
        if (ragRes.data && ragRes.data.success && ragRes.data.results.length > 0) {
          const closest = ragRes.data.results[0];
          // If similarity score is high enough (> 0.6) assume this might be what they mean
          if (closest.similarity > 0.6) {
            const mappedMetadata = closest.metadata;
            foundMedicine = {
              Medicine_ID: mappedMetadata.medicine_id,
              Medicine_Name: mappedMetadata.name,
              Brand: mappedMetadata.brand,
              Generic_Name: mappedMetadata.generic_name,
              Strength: mappedMetadata.strength,
              Use_Case: mappedMetadata.use_case,
              Alternative: mappedMetadata.alternative,
              Stock: mappedMetadata.stock,
              Price: mappedMetadata.price,
              Dosage: mappedMetadata.dosage,
              Warnings: mappedMetadata.warnings,
              SideEffects: mappedMetadata.side_effects,
              Category: mappedMetadata.category,
              RAG_Similarity: closest.similarity
            };
          }
        }
      } catch (err) {
        console.warn('RAG Query Service failed in Search Controller:', err.message);
      }
    }

    // Save search log
    if (process.env.MONGO_CONNECTED === 'true') {
      await SearchLog.create(logData);
    } else {
      mockDb.saveMockSearchLog(logData);
    }

    res.status(200).json({
      success: true,
      found: !!foundMedicine,
      medicine: foundMedicine,
      alternatives: alternatives
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

module.exports = {
  getMedicines,
  searchMedicine,
  uploadMedicinesCsv,
  updateMedicine,
  deleteMedicine
};
