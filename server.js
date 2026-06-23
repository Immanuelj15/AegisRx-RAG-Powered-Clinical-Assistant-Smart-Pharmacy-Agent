require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const connectDB = require('./backend/config/db');
const authRoutes = require('./backend/routes/authRoutes');
const medicineRoutes = require('./backend/routes/medicineRoutes');
const aiRoutes = require('./backend/routes/aiRoutes');
const analyticsRoutes = require('./backend/routes/analyticsRoutes');

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow images to be loaded by React from backend uploads
}));
app.use(cors());
app.use(express.json());

// Dynamic upload directory creation
const uploadDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Rate Limiter to prevent brute force and scraping
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Register Modular API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', analyticsRoutes);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date(),
    mongodbConnected: process.env.MONGO_CONNECTED === 'true',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Seed CSV Data & Sync Vector Database on startup
const autoSeedOnStartup = async () => {
  try {
    const Medicine = require('./backend/models/Medicine');
    const User = require('./backend/models/User');
    const csvPath = path.join(__dirname, 'backend', 'csv', 'medicines.csv');

    if (!fs.existsSync(csvPath)) {
      console.warn(`Seed CSV file not found at ${csvPath}, skipping startup sync.`);
      return;
    }

    // 1. Sync MongoDB users if missing
    if (process.env.MONGO_CONNECTED === 'true') {
      const patientExists = await User.findOne({ email: 'patient@medassist.com' });
      if (!patientExists) {
        console.log('Demo user accounts missing. Seeding default demo accounts in MongoDB...');
        const defaultUsers = [
          {
            name: 'John Patient',
            email: 'patient@medassist.com',
            password: 'patient123',
            role: 'Patient',
            phone: '123-456-7890',
            age: 32,
            gender: 'Male',
            medicalHistory: 'None'
          },
          {
            name: 'Sarah Pharmacist',
            email: 'pharmacist@medassist.com',
            password: 'pharmacist123',
            role: 'Pharmacist',
            phone: '987-654-3210',
            age: 28,
            gender: 'Female',
            medicalHistory: ''
          },
          {
            name: 'Alex Admin',
            email: 'admin@medassist.com',
            password: 'admin123',
            role: 'Admin',
            phone: '555-555-5555',
            age: 40,
            gender: 'Male',
            medicalHistory: ''
          }
        ];

        // Create sequentially to trigger pre-save password-hashing hooks
        for (const u of defaultUsers) {
          const userExists = await User.findOne({ email: u.email });
          if (!userExists) {
            await User.create(u);
          }
        }
        console.log('Seeded default demo users in MongoDB successfully.');
      }
    }

    // 2. Sync MongoDB medicines if database is empty
    if (process.env.MONGO_CONNECTED === 'true') {
      const count = await Medicine.countDocuments({});
      if (count === 0) {
        console.log('MongoDB catalog empty. Seeding from medicines.csv...');
        const csvParser = require('csv-parser');
        const parsed = [];
        
        fs.createReadStream(csvPath)
          .pipe(csvParser())
          .on('data', (row) => {
            if (row.Medicine_Name) {
              parsed.push({
                ...row,
                Stock: parseInt(row.Stock) || 0,
                Price: parseFloat(row.Price) || 0.0,
                BeforeFood: String(row.BeforeFood).toLowerCase() === 'true',
                AfterFood: String(row.AfterFood).toLowerCase() === 'true',
              });
            }
          })
          .on('end', async () => {
            await Medicine.insertMany(parsed);
            console.log(`Successfully seeded ${parsed.length} medicines in MongoDB.`);
          });
      }
    }

    // 3. Trigger Flask ChromaDB Ingestion
    const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5001';
    console.log(`Pinging RAG service at ${RAG_SERVICE_URL} for auto-ingestion...`);
    
    // Non-blocking call after 3 seconds to give Python time to boot
    setTimeout(async () => {
      try {
        const ragRes = await axios.post(`${RAG_SERVICE_URL}/api/rag/ingest`, {
          csv_path: csvPath
        });
        if (ragRes.data && ragRes.data.success) {
          console.log('ChromaDB Vector Store Synced successfully on startup!');
        }
      } catch (err) {
        console.warn('RAG service auto-ingestion delayed or Python service is not running yet. This is expected if they boot together.');
      }
    }, 4000);

  } catch (error) {
    console.error('Auto-seed failed:', error.message);
  }
};

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server after DB Connection attempt
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Express Server running on http://127.0.0.1:${PORT}`);
    autoSeedOnStartup();
  });
};

startServer();
