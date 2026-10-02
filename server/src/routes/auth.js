const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validate } = require('../utils/validate');

const router = express.Router();

const sign = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

router.post(
  '/register',
  validate({
    name: { required: true, minLength: 2, maxLength: 80 },
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 8, maxLength: 100 },
  }),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'An account with this email already exists' });

      const user = await User.create({ name, email, passwordHash: await User.hashPassword(password) });
      res.status(201).json({ token: sign(user), user: user.toSafeJSON() });
    } catch (err) { next(err); }
  }
);

router.post(
  '/login',
  validate({
    email: { required: true, type: 'email' },
    password: { required: true },
  }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user || !(await user.verifyPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      res.json({ token: sign(user), user: user.toSafeJSON() });
    } catch (err) { next(err); }
  }
);

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: user.toSafeJSON() });
  } catch (err) { next(err); }
});

// Register a device token for push notifications
router.post('/fcm-token', auth, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(422).json({ message: 'token is required' });
    await User.updateOne({ _id: req.user.id }, { $addToSet: { fcmTokens: token } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
