const express = require('express');
const router = express.Router();
const { 
  getSchedules, 
  createSchedule, 
  takeDose, 
  requestRefill 
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSchedules);
router.post('/create', protect, createSchedule);
router.post('/take-dose', protect, takeDose);
router.post('/request-refill', protect, requestRefill);

module.exports = router;
