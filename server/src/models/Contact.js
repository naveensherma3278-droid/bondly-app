const mongoose = require('mongoose');

// Birthday is stored as recurring day+month (NOT a single Date) so yearly
// reminders never depend on a fixed year. Feb 29 rolls to Feb 28 off-leap years.
const contactSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    day: { type: Number, required: true, min: 1, max: 31 },
    month: { type: Number, required: true, min: 1, max: 12 },
    birthYear: { type: Number, min: 1900, max: new Date().getFullYear() },
    relationship: {
      type: String,
      enum: ['friend', 'family', 'colleague', 'partner', 'other'],
      default: 'friend',
    },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    interests: { type: [String], default: [] },
    favoriteColor: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    lastContactedAt: { type: Date }, // feeds the relationship-strength score (Phase 4)
  },
  { timestamps: true }
);

// Fast per-user upcoming-birthday scans + unique contact names per user
contactSchema.index({ user: 1, month: 1, day: 1 });
contactSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Contact', contactSchema);
