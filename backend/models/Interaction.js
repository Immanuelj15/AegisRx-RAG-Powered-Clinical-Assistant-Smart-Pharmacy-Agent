const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  drugA: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  drugB: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  severity: {
    type: String,
    enum: ['High', 'Moderate', 'Mild'],
    default: 'Moderate'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to speed up bidirectional matching and prevent duplicate pairs
InteractionSchema.index({ drugA: 1, drugB: 1 }, { unique: true });

module.exports = mongoose.model('Interaction', InteractionSchema);
