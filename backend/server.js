require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/auth');

const app = express();
connectDB();

// Trust proxy (EasyPanel/Nginx forwarding)
app.set('trust proxy', 1);

// CORS — manual para garantir (antes de TUDO)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/partner', require('./routes/partner'));
app.use('/api/indication', require('./routes/indication'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contract', require('./routes/contract'));
app.use('/api/external', require('./routes/external'));
app.use('/api/webhook', require('./routes/webhook'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`\n🚀 Portal Parceiros API v2.0 — porta ${PORT}`);
  console.log(`📍 ${process.env.NODE_ENV || 'development'}`);

  const emailService = require('./services/email');
  await emailService.verifyConnection();

  const CommissionCron = require('./services/commissionCron');
  CommissionCron.start();

  const InactivityChecker = require('./services/inactivityChecker');
  InactivityChecker.start();
});
