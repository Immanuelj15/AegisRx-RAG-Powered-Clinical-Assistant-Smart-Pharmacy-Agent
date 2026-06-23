const express = require('express');
const router = express.Router();
const { getDashboardStats, getPopularMedicines } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('Pharmacist', 'Admin'), getDashboardStats);
router.get('/popular', protect, authorize('Pharmacist', 'Admin'), getPopularMedicines);

module.exports = router;
