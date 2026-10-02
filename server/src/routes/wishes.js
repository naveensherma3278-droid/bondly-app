const express = require('express');
const Contact = require('../models/Contact');
const ReminderJob = require('../models/ReminderJob');
const auth = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { generateWish, TONES } = require('../services/ai');
const { nextBirthdayDate, atTime } = require('../utils/dates');

const router = express.Router();
router.use(auth);

router.get('/tones', (_req, res) => res.json({ tones: TONES }));

// POST /api/wishes/generate — preview an AI wish before scheduling
router.post(
  '/generate',
  validate({
    contactId: { required: true },
    tone: { required: true, enum: TONES },
  }),
  async (req, res, next) => {
    try {
      const contact = await Contact.findOne({ _id: req.body.contactId, user: req.user.id });
      if (!contact) return res.status(404).json({ message: 'Contact not found' });
      const text = await generateWish({
        name: contact.name,
        relationship: contact.relationship,
        tone: req.body.tone,
        interests: contact.interests,
      });
      res.json({ text });
    } catch (err) { next(err); }
  }
);

// POST /api/wishes/schedule — upsert the midnight auto-wish for this year
router.post(
  '/schedule',
  validate({
    contactId: { required: true },
    tone: { required: true, enum: TONES },
  }),
  async (req, res, next) => {
    try {
      const contact = await Contact.findOne({ _id: req.body.contactId, user: req.user.id });
      if (!contact) return res.status(404).json({ message: 'Contact not found' });

      const birthday = nextBirthdayDate(contact.day, contact.month);
      const year = birthday.getFullYear();
      const text = await generateWish({
        name: contact.name,
        relationship: contact.relationship,
        tone: req.body.tone,
        interests: contact.interests,
      });

      const job = await ReminderJob.findOneAndUpdate(
        { contact: contact._id, type: 'midnight', year },
        {
          $setOnInsert: {
            user: req.user.id,
            contact: contact._id,
            type: 'midnight',
            year,
            runAt: atTime(birthday, 0, 0),
            channel: 'push',
          },
          $set: { 'payload.wishText': text },
        },
        { upsert: true, new: true }
      );
      res.json({ scheduled: true, runAt: job.runAt, wishText: text });
    } catch (err) { next(err); }
  }
);

module.exports = router;
