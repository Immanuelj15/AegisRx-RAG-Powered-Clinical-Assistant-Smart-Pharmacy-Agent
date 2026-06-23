const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  Medicine_ID: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  Medicine_Name: {
    type: String,
    required: true,
    trim: true
  },
  Brand: {
    type: String,
    default: ''
  },
  Generic_Name: {
    type: String,
    default: ''
  },
  Strength: {
    type: String,
    default: ''
  },
  Use_Case: {
    type: String,
    default: ''
  },
  Alternative: {
    type: String,
    default: ''
  },
  Stock: {
    type: Number,
    default: 0
  },
  Price: {
    type: Number,
    default: 0.0
  },
  Manufacturer: {
    type: String,
    default: ''
  },
  Dosage: {
    type: String,
    default: ''
  },
  Morning: {
    type: String,
    default: '0'
  },
  Afternoon: {
    type: String,
    default: '0'
  },
  Night: {
    type: String,
    default: '0'
  },
  BeforeFood: {
    type: Boolean,
    default: false
  },
  AfterFood: {
    type: Boolean,
    default: false
  },
  SideEffects: {
    type: String,
    default: ''
  },
  Warnings: {
    type: String,
    default: ''
  },
  Expiry: {
    type: String,
    default: ''
  },
  Category: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medicine', MedicineSchema);
