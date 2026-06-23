const mongoose = require('mongoose');

const SearchLogSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userRole: {
    type: String,
    enum: ['Patient', 'Pharmacist', 'Admin', 'Guest'],
    default: 'Guest'
  },
  wasFound: {
    type: Boolean,
    default: false
  },
  medicineName: {
    type: String,
    default: ''
  },
  alternativesSuggested: {
    type: [String],
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SearchLog', SearchLogSchema);
