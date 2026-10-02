const express = require('express');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { scheduleJobsForContact } = require('../services/scheduler');
const { nextBirthdayDate, daysUntil } = require('../utils/dates');

const router = express.Router();
router.use(auth);

const contactRules = {
  name: { required: true, minLength: 1, maxLength: 80 },
  day: { required: true, type: 'int', min: 1, max: 31 },
  month: { required: true, type: 'int', min: 1, max: 12 },
  birthYear: { type: 'int', min: 1900, max: new Date().getFullYear() },
  relationship: { enum: ['friend', 'family', 'colleague', 'partner', 'other'] },
  phone: { maxLength: 20 },
  email: { type: 'email' },
  favoriteColor: { maxLength: 30 },
  notes: { maxLength: 2000 },
};

function decorate(contact) {
  const next = nextBirthdayDate(contact.day, contact.month);
  return { ...contact.toObject(), nextBirthday: next, daysLeft: daysUntil(next) };
}

// GET /api/contacts/upcoming — next 60 days, soonest first
router.get('/upcoming', async (req, res, next) => {
  try {
    const contacts = await Contact.find({ user: req.user.id });
    res.json(
      contacts
        .map(decorate)
        .filter((c) => c.daysLeft <= 60)
        .sort((a, b) => a.daysLeft - b.daysLeft)
    );
  } catch (err) { next(err); }
});

// GET /api/contacts — all contacts (calendar view)
router.get('/', async (req, res, next) => {
  try {
    const contacts = await Contact.find({ user: req.user.id }).sort({ month: 1, day: 1 });
    res.json(contacts.map(decorate));
  } catch (err) { next(err); }
});

router.post('/', validate(contactRules), async (req, res, next) => {
  try {
    const contact = await Contact.create({ ...req.body, user: req.user.id });
    await scheduleJobsForContact(contact); // idempotent — unique (contact,type,year)
    res.status(201).json(decorate(contact));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already have a contact with that name' });
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, user: req.user.id });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(decorate(contact));
  } catch (err) { next(err); }
});

router.put('/:id', validate(contactRules), async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    await scheduleJobsForContact(contact); // re-sync if birthday changed
    res.json(decorate(contact));
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Relationship-strength feed (Phase 4 building block)
router.post('/:id/pinged', async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { lastContactedAt: new Date() } },
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(decorate(contact));
  } catch (err) { next(err); }
});

module.exports = router;
