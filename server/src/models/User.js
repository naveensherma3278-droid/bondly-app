const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    fcmTokens: { type: [String], default: [] },
    plan: { type: String, enum: ['free', 'premium', 'premium_plus'], default: 'free' },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 12);
userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  return { id: this._id, name: this.name, email: this.email, plan: this.plan };
};

module.exports = mongoose.model('User', userSchema);
