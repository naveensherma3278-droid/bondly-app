const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google's public DNS
require('dotenv').config();
console.log('JWT SECRET LOADED:', process.env.JWT_SECRET);
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { startScheduler } = require('./services/scheduler');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const wishRoutes = require('./routes/wishes');
const giftRoutes = require('./routes/gifts');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? true, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));

// Rate-limit auth endpoints against brute force
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'bondly-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/wishes', wishRoutes);
app.use('/api/gifts', giftRoutes);

// Central error handler — always JSON, never leaks internals
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ message: err.status ? err.message : 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Bondly API listening on :${PORT}`));
    startScheduler(); // minute-tick reminder worker
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
