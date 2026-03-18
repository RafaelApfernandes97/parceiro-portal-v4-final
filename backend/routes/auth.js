const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const emailService = require('../services/email');
const { authLimiter } = require('../middleware/auth');
const { nameValidator } = require('../validators/brazilian');

// POST /api/auth/register
router.post('/register', authLimiter, [
  body('email').isEmail().withMessage('E-mail inválido.'),
  body('password').isLength({ min: 6 }).withMessage('Senha mín 6 caracteres.'),
  body('nome').trim().isLength({ min: 3 }).custom(nameValidator.options)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password, nome } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const activationToken = uuidv4();
    const user = new User({
      email: email.toLowerCase(), password, role: 'partner', isActive: false, activationToken,
      responsavel: { nome, email: email.toLowerCase() }, onboardingStep: 'pending_activation'
    });
    await user.save();

    try { await emailService.sendActivationEmail(email, activationToken, nome); } catch (e) { console.error('Activation email error:', e.message); }

    res.status(201).json({ message: 'Cadastro realizado! Verifique seu e-mail.', userId: user._id });
  } catch (err) { console.error('Register error:', err); res.status(500).json({ error: 'Erro interno.' }); }
});

// GET /api/auth/activate/:token
router.get('/activate/:token', async (req, res) => {
  try {
    const user = await User.findOne({ activationToken: req.params.token });
    if (!user) return res.status(400).json({ error: 'Token inválido ou já utilizado.' });
    user.isActive = true; user.activationToken = null; user.onboardingStep = 'company_data';
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ message: 'Conta ativada!', token, user: { id: user._id, email: user.email, role: user.role, onboardingStep: user.onboardingStep } });
  } catch (err) { res.status(500).json({ error: 'Erro interno.' }); }
});

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail(), body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    if (!user.isActive) return res.status(403).json({ error: 'Conta não ativada.' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, nome: user.responsavel?.nome || '', onboardingStep: user.onboardingStep } });
  } catch (err) { res.status(500).json({ error: 'Erro interno.' }); }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  res.json({ user: { id: req.user._id, email: req.user.email, role: req.user.role, nome: req.user.responsavel?.nome || '', onboardingStep: req.user.onboardingStep, contractSignedAt: req.user.contractSignedAt } });
});

module.exports = router;
