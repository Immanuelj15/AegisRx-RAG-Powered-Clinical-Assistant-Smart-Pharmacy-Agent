const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  getMedicines, 
  searchMedicine, 
  uploadMedicinesCsv, 
  updateMedicine, 
  deleteMedicine,
  checkInteractions,
  getFDAData,
  addMedicine
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure Multer for CSV uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `medicines-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

router.get('/', protect, getMedicines);
router.get('/search', protect, searchMedicine);
router.get('/fda/:drugName', protect, getFDAData);
router.post('/interaction-check', protect, checkInteractions);
router.post('/upload', protect, authorize('Pharmacist', 'Admin'), upload.single('file'), uploadMedicinesCsv);
router.post('/add', protect, authorize('Pharmacist', 'Admin'), addMedicine);
router.put('/update', protect, authorize('Pharmacist', 'Admin'), updateMedicine);
router.delete('/delete', protect, authorize('Admin'), deleteMedicine);

module.exports = router;
