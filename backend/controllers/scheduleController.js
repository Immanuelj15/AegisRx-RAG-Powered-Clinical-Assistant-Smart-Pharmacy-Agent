const PrescriptionSchedule = require('../models/PrescriptionSchedule');
const Medicine = require('../models/Medicine');
const mockDb = require('../utils/mockDb');

// @desc    Get all active schedules for the logged in user
// @route   GET /api/schedules
// @access  Private
const getSchedules = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let list = [];

    if (process.env.MONGO_CONNECTED === 'true') {
      list = await PrescriptionSchedule.find({ userId }).sort({ createdAt: -1 });
    } else {
      list = mockDb.getMockSchedulesByUserId(userId);
    }

    res.status(200).json({ success: true, schedules: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new medication schedule (Doctor writing or AI parse save)
// @route   POST /api/schedules/create
// @access  Private
const createSchedule = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { medicineName, strength, frequency, foodRelation, durationDays, startDate } = req.body;

    if (!medicineName) {
      return res.status(400).json({ success: false, error: 'Medicine name is required' });
    }

    const scheduleData = {
      userId,
      medicineName,
      strength: strength || '',
      frequency: frequency || { morning: false, afternoon: false, night: false },
      foodRelation: foodRelation || 'None',
      durationDays: parseInt(durationDays) || 7,
      startDate: startDate ? new Date(startDate) : new Date(),
      dosesTaken: []
    };

    let newSchedule = null;
    if (process.env.MONGO_CONNECTED === 'true') {
      newSchedule = await PrescriptionSchedule.create(scheduleData);
    } else {
      newSchedule = mockDb.saveMockSchedule(scheduleData);
    }

    res.status(201).json({ success: true, schedule: newSchedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Log a taken or untaken dose status
// @route   POST /api/schedules/take-dose
// @access  Private
const takeDose = async (req, res) => {
  try {
    const { scheduleId, date, timeSlot, isTaken } = req.body;

    if (!scheduleId || !date || !timeSlot) {
      return res.status(400).json({ success: false, error: 'ScheduleId, date, and timeSlot are required' });
    }

    let schedule = null;
    if (process.env.MONGO_CONNECTED === 'true') {
      schedule = await PrescriptionSchedule.findById(scheduleId);
    } else {
      schedule = mockDb.getMockSchedulesByUserId(req.user._id || req.user.id).find(s => s._id === scheduleId || s.id === scheduleId);
    }

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    // Update doses taken array
    const existIdx = schedule.dosesTaken.findIndex(d => d.date === date && d.timeSlot === timeSlot);

    if (isTaken) {
      // Add if not exists
      if (existIdx === -1) {
        schedule.dosesTaken.push({ date, timeSlot });
      }
    } else {
      // Remove if exists
      if (existIdx !== -1) {
        schedule.dosesTaken.splice(existIdx, 1);
      }
    }

    // Save
    if (process.env.MONGO_CONNECTED === 'true') {
      await schedule.save();
    } else {
      mockDb.saveMockSchedule(schedule);
    }

    res.status(200).json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Request a stock refill for medication
// @route   POST /api/schedules/request-refill
// @access  Private
const requestRefill = async (req, res) => {
  try {
    const { scheduleId } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ success: false, error: 'Schedule ID is required' });
    }

    let schedule = null;
    if (process.env.MONGO_CONNECTED === 'true') {
      schedule = await PrescriptionSchedule.findById(scheduleId);
    } else {
      schedule = mockDb.getMockSchedulesByUserId(req.user._id || req.user.id).find(s => s._id === scheduleId || s.id === scheduleId);
    }

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    // Flag refill as requested
    schedule.refillRequested = true;

    // Simulate inventory consumption: check off 30 units from the matching medicine
    if (process.env.MONGO_CONNECTED === 'true') {
      await schedule.save();
      await Medicine.findOneAndUpdate(
        { Medicine_Name: { $regex: schedule.medicineName, $options: 'i' } },
        { $inc: { Stock: -30 } } // dispense/refill deduction
      );
    } else {
      mockDb.saveMockSchedule(schedule);
      const matchingMed = mockDb.getMockMedicines().find(m => m.Medicine_Name.toLowerCase().includes(schedule.medicineName.toLowerCase()));
      if (matchingMed) {
        matchingMed.Stock = Math.max(0, matchingMed.Stock - 30);
        mockDb.saveMockMedicine(matchingMed);
      }
    }

    res.status(200).json({ success: true, message: 'Refill requested and processed successfully', schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getSchedules,
  createSchedule,
  takeDose,
  requestRefill
};
