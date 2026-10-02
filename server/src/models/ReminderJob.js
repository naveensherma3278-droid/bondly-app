const mongoose = require('mongoose');

// Single source of truth for ALL scheduled moments (reminders + auto-wishes).
// Unique (contact, type, year) makes scheduling idempotent: re-running setup
// can never double-notify.
const reminderJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    type: {
      type: String,
      required: true,
      enum: ['t30', 't7', 't3', 't1', 'morning', 'midnight'],
    },
    year: { type: Number, required: true }, // the birthday-year this job belongs to
    runAt: { type: Date, required: true, index: true },
    channel: { type: String, enum: ['push', 'whatsapp', 'sms', 'email'], default: 'push' },
    status: { type: String, enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'], default: 'pending', index: true },
    payload: {
      title: String,
      body: String,
      wishText: String,
      giftIdeas: [String],
    },
    error: { type: String },
  },
  { timestamps: true }
);

reminderJobSchema.index({ contact: 1, type: 1, year: 1 }, { unique: true });
reminderJobSchema.index({ status: 1, runAt: 1 });

module.exports = mongoose.model('ReminderJob', reminderJobSchema);
