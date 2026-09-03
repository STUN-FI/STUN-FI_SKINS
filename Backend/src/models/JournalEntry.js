const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: ['Operations', 'Client', 'Production', 'Notes'],
      default: 'Notes',
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.JournalEntry || mongoose.model('JournalEntry', JournalEntrySchema);
