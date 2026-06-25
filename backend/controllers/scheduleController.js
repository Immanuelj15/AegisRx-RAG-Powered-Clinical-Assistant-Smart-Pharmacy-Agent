const { prisma } = require('../config/db');
const mockDb = require('../utils/mockDb');

const formatSchedule = (s) => {
  return {
    ...s,
    frequency: {
      morning: s.freqMorning,
      afternoon: s.freqAfternoon,
      night: s.freqNight
    }
  };
};

// @desc    Get all active schedules for the logged in user
// @route   GET /api/schedules
// @access  Private
const getSchedules = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let list = [];

    if (process.env.DB_CONNECTED === 'true') {
      const rawList = await prisma.prescriptionSchedule.findMany({ 
        where: { userId }, 
        orderBy: { createdAt: 'desc' } 
      });
      list = rawList.map(formatSchedule);
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

    let newSchedule = null;
    if (process.env.DB_CONNECTED === 'true') {
      const rawSchedule = await prisma.prescriptionSchedule.create({
        data: {
          userId,
          medicineName,
          strength: strength || '',
          freqMorning: frequency?.morning || false,
          freqAfternoon: frequency?.afternoon || false,
          freqNight: frequency?.night || false,
          foodRelation: foodRelation || 'None',
          durationDays: parseInt(durationDays) || 7,
          startDate: startDate ? new Date(startDate) : new Date(),
          dosesTaken: []
        }
      });
      newSchedule = formatSchedule(rawSchedule);
    } else {
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
    if (process.env.DB_CONNECTED === 'true') {
      schedule = await prisma.prescriptionSchedule.findUnique({ where: { id: scheduleId } });
      if (!schedule) {
        return res.status(404).json({ success: false, error: 'Schedule not found' });
      }

      let doses = Array.isArray(schedule.dosesTaken) ? [...schedule.dosesTaken] : [];
      const existIdx = doses.findIndex(d => d.date === date && d.timeSlot === timeSlot);

      if (isTaken) {
        if (existIdx === -1) doses.push({ date, timeSlot });
      } else {
        if (existIdx !== -1) doses.splice(existIdx, 1);
      }

      schedule = await prisma.prescriptionSchedule.update({
        where: { id: scheduleId },
        data: { dosesTaken: doses }
      });
      schedule = formatSchedule(schedule);
    } else {
      schedule = mockDb.getMockSchedulesByUserId(req.user._id || req.user.id).find(s => s._id === scheduleId || s.id === scheduleId);
      if (!schedule) {
        return res.status(404).json({ success: false, error: 'Schedule not found' });
      }

      const existIdx = schedule.dosesTaken.findIndex(d => d.date === date && d.timeSlot === timeSlot);

      if (isTaken) {
        if (existIdx === -1) schedule.dosesTaken.push({ date, timeSlot });
      } else {
        if (existIdx !== -1) schedule.dosesTaken.splice(existIdx, 1);
      }
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
    if (process.env.DB_CONNECTED === 'true') {
      schedule = await prisma.prescriptionSchedule.findUnique({ where: { id: scheduleId } });
      
      if (!schedule) {
        return res.status(404).json({ success: false, error: 'Schedule not found' });
      }

      schedule = await prisma.prescriptionSchedule.update({
        where: { id: scheduleId },
        data: { refillRequested: true }
      });

      // Deduct 30 units
      await prisma.medicine.updateMany({
        where: { Medicine_Name: { contains: schedule.medicineName, mode: 'insensitive' } },
        data: { Stock: { decrement: 30 } }
      });

      schedule = formatSchedule(schedule);
    } else {
      schedule = mockDb.getMockSchedulesByUserId(req.user._id || req.user.id).find(s => s._id === scheduleId || s.id === scheduleId);
      if (!schedule) {
        return res.status(404).json({ success: false, error: 'Schedule not found' });
      }
      schedule.refillRequested = true;
      mockDb.saveMockSchedule(schedule);

      const matchingMed = mockDb.getMockMedicines().find(m => m.Medicine_Name.toLowerCase().includes(schedule.medicineName.toLowerCase()));
      if (matchingMed) {
        matchingMed.Stock = Math.max(0, matchingMed.Stock - 30);
        mockDb.saveMockMedicine(matchingMed);
      }
    }

    res.status(200).json({ success: true, message: 'Refill requested and inventory updated.', schedule });
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
