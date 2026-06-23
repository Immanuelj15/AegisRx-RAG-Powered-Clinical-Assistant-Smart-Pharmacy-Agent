const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  chatAgent, 
  understandPrescription, 
  answerFaq, 
  suggestAlternative,
  getChatSessions,
  exportSignedPrescription,
  exportProcurementPO,
  matchClinicalTrials,
  auditFdaRecall,
  researchMedicine,
  symptomCheck,
  generateHealthReport,
  dosageCalculator,
  checkInteractions,
  generateDietPlan,
  analyzeGenomics
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer for Prescription Image Uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `prescription-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDFs are allowed!'));
  }
});

router.post('/chat', protect, chatAgent);
router.post('/prescription', protect, uploadImage.single('file'), understandPrescription);
router.post('/faq', answerFaq);
router.post('/alternative', protect, suggestAlternative);
router.get('/sessions', protect, getChatSessions);

// PDF Export Routes
const { generateChatPDF, generatePrescriptionPDF } = require('../utils/pdfGenerator');

router.post('/export-pdf', protect, (req, res) => {
  const { title, messages } = req.body;
  generateChatPDF(res, title, messages);
});

router.post('/export-prescription-pdf', protect, (req, res) => {
  const { analysis } = req.body;
  generatePrescriptionPDF(res, analysis);
});

router.post('/export-signed-prescription-pdf', protect, exportSignedPrescription);
router.post('/export-po-pdf', protect, exportProcurementPO);

// Clinical Trial & openFDA Safety Routes
router.get('/trials/:condition', protect, matchClinicalTrials);
router.get('/fda-audit/:name', protect, auditFdaRecall);
router.get('/research/:name', protect, researchMedicine);

// Clinical AI Tools
router.post('/symptom-check', protect, symptomCheck);
router.post('/health-report', protect, generateHealthReport);
router.post('/dosage-calc', protect, dosageCalculator);

// @route   POST /api/ai/diet-plan
router.post('/diet-plan', protect, generateDietPlan);

// @route   POST /api/ai/check-interactions
router.post('/check-interactions', protect, checkInteractions);

// @route   POST /api/ai/genomic-analysis
router.post('/genomic-analysis', protect, analyzeGenomics);

module.exports = router;
