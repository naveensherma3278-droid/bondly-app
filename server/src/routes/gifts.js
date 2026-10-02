const express = require('express');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');
const { suggestGifts } = require('../services/gifts');

const router = express.Router();
router.use(auth);

// GET /api/gifts/suggest/:contactId
router.get('/suggest/:contactId', async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.contactId, user: req.user.id });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ contact: contact.name, ...suggestGifts(contact) });
  } catch (err) { next(err); }
});

module.exports = router;
