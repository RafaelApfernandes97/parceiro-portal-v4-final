const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, partnerOnly } = require('../middleware/auth');
const { cnpjValidator } = require('../validators/brazilian');
const Indication = require('../models/Indication');
const Company = require('../models/Company');
const CommissionCycle = require('../models/CommissionCycle');
const User = require('../models/User');
const emailService = require('../services/email');

const nfeDir = path.join(__dirname, '..', 'uploads', 'nfe');
if (!fs.existsSync(nfeDir)) fs.mkdirSync(nfeDir, { recursive: true });
const uploadNfe = multer({ storage: multer.diskStorage({ destination: (r, f, cb) => cb(null, nfeDir), filename: (r, f, cb) => cb(null, Date.now() + '-nfe-' + f.originalname.replace(/\s/g, '_')) }), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (r, f, cb) => f.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Apenas PDF.')) });

// ─── CREATE INDICATION ───
router.post('/', auth, partnerOnly, [
  body('nomeEmpresa').trim().isLength({ min: 3 }),
  body('cnpj').trim().custom(cnpjValidator.options),
  body('segmento').trim().isLength({ min: 2 }),
  body('nomeContato').trim().isLength({ min: 3 }),
  body('emailContato').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (req.user.onboardingStep !== 'active') return res.status(403).json({ error: 'Complete o onboarding.' });

    // Check duplicate (excluding insucesso and rejected)
    const existing = await Indication.findOne({ cnpj: req.body.cnpj, status: { $nin: ['insucesso'] }, statusValidacao: { $ne: 'rejeitada' } });
    if (existing) return res.status(400).json({ error: 'Esta empresa já foi indicada.' });

    // Check if already active/recent client (6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentClient = await Indication.findOne({ cnpj: req.body.cnpj, statusCliente: { $in: ['ativo', 'inativo'] }, updatedAt: { $gte: sixMonthsAgo } });
    if (recentClient) return res.status(400).json({ error: 'Esta empresa é ou foi cliente ativo nos últimos 6 meses.' });

    const ind = new Indication({
      partnerId: req.user._id, nomeEmpresa: req.body.nomeEmpresa, cnpj: req.body.cnpj,
      segmento: req.body.segmento, site: req.body.site || '', nomeContato: req.body.nomeContato,
      emailContato: req.body.emailContato, telefoneContato: req.body.telefoneContato || '',
      statusValidacao: 'pendente', status: 'nova',
      statusHistory: [{ status: 'nova', changedBy: req.user._id, changedAt: new Date() }]
    });
    await ind.save();

    // Update partner's last indication date (for inactivity tracking)
    await User.findByIdAndUpdate(req.user._id, { lastIndicationAt: new Date(), $set: { inactivityWarnings: [] } });

    const company = await Company.findOne({ userId: req.user._id });
    try { await emailService.sendIndicationNotification(ind.toObject(), company?.razaoSocial || req.user.responsavel?.nome || 'Parceiro'); } catch (e) {}

    res.status(201).json({ message: 'Indicação enviada! Aguarde validação pela equipe Mais Chat.', indication: ind });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro.' }); }
});

// ─── LIST PARTNER'S INDICATIONS ───
router.get('/', auth, partnerOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, statusValidacao, month, year } = req.query;
    const q = { partnerId: req.user._id };
    if (status) q.status = status;
    if (statusValidacao) q.statusValidacao = statusValidacao;
    if (month && year) { const m = parseInt(month), y = parseInt(year); q.createdAt = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) }; }
    else if (year) { const y = parseInt(year); q.createdAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) }; }

    const indications = await Indication.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Indication.countDocuments(q);
    const stats = await Indication.aggregate([{ $match: { partnerId: req.user._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const valStats = await Indication.aggregate([{ $match: { partnerId: req.user._id } }, { $group: { _id: '$statusValidacao', count: { $sum: 1 } } }]);

    const fin = await Indication.aggregate([
      { $match: { partnerId: req.user._id } }, { $unwind: '$pagamentos' }, { $match: { 'pagamentos.status': 'paga' } },
      { $group: { _id: null, totalPago: { $sum: '$pagamentos.valor' } } }
    ]);

    res.json({
      indications, total, page: parseInt(page), totalPages: Math.ceil(total / limit),
      stats: stats.reduce((a, s) => { a[s._id] = s.count; return a; }, {}),
      validationStats: valStats.reduce((a, s) => { a[s._id] = s.count; return a; }, {}),
      financial: { totalPago: fin[0]?.totalPago || 0 }
    });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ─── GET SINGLE INDICATION ───
router.get('/:id', auth, partnerOnly, async (req, res) => {
  try {
    const ind = await Indication.findOne({ _id: req.params.id, partnerId: req.user._id });
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    res.json(ind);
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ─── COMMISSION CYCLES ───
router.get('/commission/cycles', auth, partnerOnly, async (req, res) => {
  try {
    const cycles = await CommissionCycle.find({ partnerId: req.user._id }).sort({ cicloInicio: -1 });
    const totals = cycles.reduce((a, c) => { a.totalComissao += c.totalComissao; if (c.status === 'pago') a.totalPago += c.totalComissao; return a; }, { totalComissao: 0, totalPago: 0 });
    res.json({ cycles, totals });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.get('/commission/cycle/:id', auth, partnerOnly, async (req, res) => {
  try {
    const cycle = await CommissionCycle.findOne({ _id: req.params.id, partnerId: req.user._id });
    if (!cycle) return res.status(404).json({ error: 'Ciclo não encontrado.' });
    res.json(cycle);
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ─── UPLOAD NFe POR CICLO ───
router.post('/commission/cycle/:id/nfe', auth, partnerOnly, uploadNfe.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF obrigatório.' });
    const cycle = await CommissionCycle.findOne({ _id: req.params.id, partnerId: req.user._id });
    if (!cycle) return res.status(404).json({ error: 'Ciclo não encontrado.' });
    if (!['calculado', 'fechado', 'nfe_pendente'].includes(cycle.status)) return res.status(400).json({ error: `Não é possível enviar NFe (status: ${cycle.status}).` });

    cycle.nfe = { path: req.file.path, nomeArquivo: req.file.originalname, dataEnvio: new Date(), numeroNfe: req.body.numeroNfe || '', valorNfe: req.body.valorNfe ? parseFloat(req.body.valorNfe) : cycle.totalComissao };
    cycle.status = 'nfe_enviada';
    cycle.statusHistory.push({ status: 'nfe_enviada', changedBy: req.user._id, changedAt: new Date(), observacao: `NFe ${req.body.numeroNfe || ''} enviada.` });
    await cycle.save();

    try { await emailService.send({ to: process.env.ADMIN_EMAIL, subject: `NFe Recebida — ${cycle.referencia}`, html: `<p>Parceiro enviou NFe para ciclo ${cycle.referencia}. Valor: R$ ${cycle.totalComissao.toFixed(2)}</p>` }); } catch (e) {}

    res.json({ message: 'NFe enviada! Aguarde pagamento.', cycle });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

module.exports = router;
