const mongoose = require('mongoose');

const PrescriptionScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  strength: {
    type: String,
    default: ''
  },
  frequency: {
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    night: { type: Boolean, default: false }
  },
  foodRelation: {
    type: String,
    enum: ['Before food', 'After food', 'With food', 'None'],
    default: 'None'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  durationDays: {
    type: Number,
    default: 7
  },
  dosesTaken: [
    {
      date: { type: String, required: true }, // Format "YYYY-MM-DD"
      timeSlot: { type: String, enum: ['morning', 'afternoon', 'night'], required: true }
    }
  ],
  refillRequested: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PrescriptionSchedule', PrescriptionScheduleSchema);
