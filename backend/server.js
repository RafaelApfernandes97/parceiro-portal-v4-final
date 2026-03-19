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

// CORS — deve vir antes de tudo
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.options('*', cors());

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
