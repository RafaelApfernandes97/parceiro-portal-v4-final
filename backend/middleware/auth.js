const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });
    if (!user.isActive) return res.status(403).json({ error: 'Conta não ativada.' });
    req.user = user;
    next();
  } catch (err) { res.status(401).json({ error: 'Token inválido ou expirado.' }); }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  next();
};

const partnerOnly = (req, res, next) => {
  if (req.user.role !== 'partner') return res.status(403).json({ error: 'Acesso restrito a parceiros.' });
  next();
};

const apiKeyAuth = (req, res, next) => {
  const key = req.header('X-API-Key') || req.query.apiKey;
  if (!key) return res.status(401).json({ error: 'API Key não fornecida.' });
  const primary = process.env.EXTERNAL_API_KEY_PRIMARY;
  const secondary = process.env.EXTERNAL_API_KEY_SECONDARY;
  const expiry = process.env.EXTERNAL_API_KEY_EXPIRY;
  if (expiry && new Date() > new Date(expiry)) return res.status(401).json({ error: 'API Key expirada.' });
  if (key !== primary && (secondary === 'disabled' || key !== secondary)) return res.status(401).json({ error: 'API Key inválida.' });
  req.apiKeyUsed = key === primary ? 'primary' : 'secondary';
  next();
};

const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true, legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 20,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true, legacyHeaders: false
});

const externalApiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60,
  message: { error: 'Rate limit da API externa atingido. Máximo 60 req/min.' },
  standardHeaders: true, legacyHeaders: false
});

module.exports = { auth, adminOnly, partnerOnly, apiKeyAuth, generalLimiter, authLimiter, externalApiLimiter };
