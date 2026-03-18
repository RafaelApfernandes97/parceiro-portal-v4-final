const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const Indication = require('../models/Indication');
const CommissionCycle = require('../models/CommissionCycle');
const CommissionCron = require('../services/commissionCron');
const emailService = require('../services/email');

const uploadsDir = path.join(__dirname, '..', 'uploads');
['attachments', 'comprovantes'].forEach(d => { const p = path.join(uploadsDir, d); if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); });
const uploadAttach = multer({ storage: multer.diskStorage({ destination: (r, f, cb) => cb(null, path.join(uploadsDir, 'attachments')), filename: (r, f, cb) => cb(null, Date.now() + '-' + f.originalname.replace(/\s/g, '_')) }), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadComprov = multer({ storage: multer.diskStorage({ destination: (r, f, cb) => cb(null, path.join(uploadsDir, 'comprovantes')), filename: (r, f, cb) => cb(null, Date.now() + '-comp-' + f.originalname.replace(/\s/g, '_')) }), limits: { fileSize: 10 * 1024 * 1024 } });

// ═══ DASHBOARD ═══
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const [totalPartners, activePartners, totalIndications] = await Promise.all([
      User.countDocuments({ role: 'partner' }), User.countDocuments({ role: 'partner', onboardingStep: 'active' }), Indication.countDocuments()
    ]);
    const statusBreakdown = await Indication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const pendingValidation = await Indication.countDocuments({ statusValidacao: 'pendente' });
    const recentIndications = await Indication.find().populate('partnerId', 'email responsavel.nome').sort({ createdAt: -1 }).limit(10);
    const fin = await Indication.aggregate([{ $unwind: '$pagamentos' }, { $match: { 'pagamentos.status': 'paga' } }, { $group: { _id: null, totalFaturado: { $sum: '$pagamentos.valor' }, qtd: { $sum: 1 } } }]);
    const comTotals = await CommissionCycle.aggregate([{ $group: { _id: null, totalComissao: { $sum: '$totalComissao' }, totalPago: { $sum: { $cond: [{ $eq: ['$status', 'pago'] }, '$totalComissao', 0] } } } }]);
    const monthlyRevenue = await Indication.aggregate([{ $unwind: '$pagamentos' }, { $match: { 'pagamentos.status': 'paga' } }, { $group: { _id: { y: { $year: '$pagamentos.dataPagamento' }, m: { $month: '$pagamentos.dataPagamento' } }, total: { $sum: '$pagamentos.valor' }, count: { $sum: 1 } } }, { $sort: { '_id.y': -1, '_id.m': -1 } }, { $limit: 12 }]);
    res.json({ totalPartners, activePartners, totalIndications, pendingValidation, statusBreakdown: statusBreakdown.reduce((a, s) => { a[s._id] = s.count; return a; }, {}), recentIndications, financial: fin[0] || { totalFaturado: 0, qtd: 0 }, commissions: comTotals[0] || { totalComissao: 0, totalPago: 0 }, monthlyRevenue });
  } catch (e) { res.status(500).json({ error: 'Erro dashboard.' }); }
});

// ═══ VALIDATE/REJECT INDICATION ═══
router.put('/indication/:id/validate', auth, adminOnly, [body('approved').isBoolean(), body('motivo').optional().trim()], async (req, res) => {
  try {
    const ind = await Indication.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    if (ind.statusValidacao !== 'pendente') return res.status(400).json({ error: 'Indicação já foi validada/rejeitada.' });

    const approved = req.body.approved;
    if (!approved && (!req.body.motivo || req.body.motivo.length < 5)) return res.status(400).json({ error: 'Motivo obrigatório para rejeição (mín 5 chars).' });

    ind.statusValidacao = approved ? 'validada' : 'rejeitada';
    ind.validadaEm = new Date();
    ind.validadaPor = req.user._id;
    if (!approved) ind.motivoRejeicao = req.body.motivo;
    if (approved) ind.status = 'em_negociacao';
    ind.statusHistory.push({ status: approved ? 'em_negociacao' : 'rejeitada', changedBy: req.user._id, changedAt: new Date(), observacao: approved ? 'Indicação validada e aceita.' : `Rejeitada: ${req.body.motivo}` });
    await ind.save();

    try { await emailService.sendValidationResult(ind.partnerId.email, ind.partnerId.responsavel?.nome || '', ind, approved, req.body.motivo); } catch (e) {}

    res.json({ message: approved ? 'Indicação validada e aceita.' : 'Indicação rejeitada.', indication: ind });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ═══ PARTNERS ═══
router.get('/partners', auth, adminOnly, async (req, res) => {
  try {
    const partners = await User.find({ role: 'partner' }).select('-password').sort({ createdAt: -1 });
    const result = await Promise.all(partners.map(async p => {
      const company = await Company.findOne({ userId: p._id });
      const totalIndications = await Indication.countDocuments({ partnerId: p._id });
      const fin = await Indication.aggregate([{ $match: { partnerId: p._id } }, { $unwind: '$pagamentos' }, { $match: { 'pagamentos.status': 'paga' } }, { $group: { _id: null, total: { $sum: '$pagamentos.valor' } } }]);
      const com = await CommissionCycle.aggregate([{ $match: { partnerId: p._id } }, { $group: { _id: null, total: { $sum: '$totalComissao' } } }]);
      return { ...p.toObject(), company: company?.toObject(), totalIndications, totalFaturado: fin[0]?.total || 0, totalComissao: com[0]?.total || 0 };
    }));
    res.json({ partners: result });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.get('/partner/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    const company = await Company.findOne({ userId: req.params.id });
    const indications = await Indication.find({ partnerId: req.params.id }).sort({ createdAt: -1 });
    const cycles = await CommissionCycle.find({ partnerId: req.params.id }).sort({ cicloInicio: -1 });
    res.json({ user, company, indications, cycles });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ═══ INDICATIONS ═══
router.get('/indications', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 30, status, partnerId, search, month, year, statusCliente, statusValidacao } = req.query;
    const q = {};
    if (status) q.status = status;
    if (statusCliente) q.statusCliente = statusCliente;
    if (statusValidacao) q.statusValidacao = statusValidacao;
    if (partnerId) q.partnerId = partnerId;
    if (search) q.$or = [{ nomeEmpresa: { $regex: search, $options: 'i' } }, { cnpj: { $regex: search, $options: 'i' } }, { nomeContato: { $regex: search, $options: 'i' } }];
    if (month && year) { const m = parseInt(month), y = parseInt(year); q.createdAt = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) }; }
    else if (year) { const y = parseInt(year); q.createdAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) }; }
    const indications = await Indication.find(q).populate('partnerId', 'email responsavel.nome').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Indication.countDocuments(q);
    const paySum = await Indication.aggregate([{ $match: { _id: { $in: indications.map(i => i._id) } } }, { $unwind: '$pagamentos' }, { $match: { 'pagamentos.status': 'paga' } }, { $group: { _id: null, totalPago: { $sum: '$pagamentos.valor' }, qtd: { $sum: 1 } } }]);
    res.json({ indications, total, page: parseInt(page), totalPages: Math.ceil(total / limit), financialSummary: paySum[0] || { totalPago: 0, qtd: 0 } });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ═══ UPDATE STATUS ═══
router.put('/indication/:id/status', auth, adminOnly, [body('status').isIn(['nova', 'em_negociacao', 'sucesso', 'insucesso', 'pausada'])], async (req, res) => {
  try {
    const ind = await Indication.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    const old = ind.status; ind.status = req.body.status;
    if (req.body.observacao) ind.observacaoAdmin = req.body.observacao;
    ind.statusHistory.push({ status: req.body.status, changedBy: req.user._id, changedAt: new Date(), observacao: req.body.observacao || '' });
    await ind.save();
    try { await emailService.sendStatusChangeToPartner(ind.partnerId.email, ind.partnerId.responsavel?.nome || '', ind, old, req.body.status); } catch (e) {}
    res.json({ message: `Status: "${old}" → "${req.body.status}"`, indication: ind });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ═══ CLIENT STATUS (with churn alert) ═══
router.put('/indication/:id/client-status', auth, adminOnly, [body('statusCliente').isIn(['prospect', 'ativo', 'inativo', 'suspenso'])], async (req, res) => {
  try {
    const ind = await Indication.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    const old = ind.statusCliente; ind.statusCliente = req.body.statusCliente;
    ind.statusClienteHistory.push({ status: req.body.statusCliente, changedBy: req.user._id, changedAt: new Date(), observacao: req.body.observacao || '' });
    if (req.body.statusCliente === 'ativo' && !ind.comissionamentoInicio) {
      ind.comissionamentoInicio = new Date();
      const fim = new Date(); fim.setMonth(fim.getMonth() + 12); ind.comissionamentoFim = fim;
    }
    await ind.save();
    try { await emailService.sendClientStatusChangeToPartner(ind.partnerId.email, ind.partnerId.responsavel?.nome || '', ind, old, req.body.statusCliente); } catch (e) {}
    // Churn alert
    if ((req.body.statusCliente === 'inativo' || req.body.statusCliente === 'suspenso') && old === 'ativo') {
      const company = await Company.findOne({ userId: ind.partnerId._id });
      try { await emailService.sendChurnAlert(ind, company?.razaoSocial || ind.partnerId.responsavel?.nome || ''); } catch (e) {}
    }
    res.json({ message: 'Status do cliente atualizado.', indication: ind });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ═══ CHURN REPORT ═══
router.get('/churn-report', auth, adminOnly, async (req, res) => {
  try {
    const churned = await Indication.find({ statusCliente: { $in: ['inativo', 'suspenso'] }, status: 'sucesso' }).populate('partnerId', 'email responsavel.nome').sort({ updatedAt: -1 });
    const impact = churned.reduce((a, i) => {
      a.totalParcelaMensal += i.valorParcela;
      a.totalComissaoMensal += i.valorParcela * (i.percentualComissao / 100);
      return a;
    }, { totalParcelaMensal: 0, totalComissaoMensal: 0 });
    res.json({ churned, count: churned.length, impact });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ═══ FINANCIALS ═══
router.put('/indication/:id/valor-parcela', auth, adminOnly, [body('valorParcela').isFloat({ min: 0 })], async (req, res) => {
  try { const ind = await Indication.findByIdAndUpdate(req.params.id, { valorParcela: req.body.valorParcela }, { new: true }); res.json({ message: 'OK', indication: ind }); } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.put('/indication/:id/commission', auth, adminOnly, [body('percentual').isFloat({ min: 0, max: 100 }), body('motivo').trim().isLength({ min: 5 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const ind = await Indication.findById(req.params.id);
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    ind.commissionAdjustments.push({ percentualAnterior: ind.percentualComissao, percentualNovo: req.body.percentual, motivo: req.body.motivo, alteradoPor: req.user._id });
    ind.percentualComissao = req.body.percentual;
    await ind.save();
    res.json({ message: `Comissão: ${req.body.percentual}%`, indication: ind });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.post('/indication/:id/payment', auth, adminOnly, [body('valor').isFloat({ min: 0.01 }), body('dataPagamento').isISO8601(), body('status').isIn(['paga', 'pendente', 'atrasada', 'cancelada'])], async (req, res) => {
  try {
    const ind = await Indication.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    const p = { valor: req.body.valor, dataPagamento: req.body.dataPagamento, dataVencimento: req.body.dataVencimento, referencia: req.body.referencia || '', status: req.body.status, observacao: req.body.observacao || '', registradoPor: 'admin' };
    ind.pagamentos.push(p);
    if (req.body.status === 'paga' && !ind.comissionamentoInicio) { ind.comissionamentoInicio = new Date(req.body.dataPagamento); const f = new Date(req.body.dataPagamento); f.setMonth(f.getMonth() + 12); ind.comissionamentoFim = f; }
    await ind.save();
    if (req.body.status === 'paga') { try { await emailService.sendPaymentNotification(ind.partnerId.email, ind.partnerId.responsavel?.nome || '', ind, p); } catch (e) {} }
    res.json({ message: 'Pagamento registrado.', indication: ind });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.post('/indication/:id/attachment', auth, adminOnly, uploadAttach.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório.' });
    const ind = await Indication.findById(req.params.id);
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    ind.anexos.push({ tipo: req.body.tipo || 'outro', nome: req.file.originalname, path: req.file.path, uploadedBy: 'admin', uploadedByUser: req.user._id });
    await ind.save();
    res.json({ message: 'Anexo adicionado.', indication: ind });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// ═══ COMMISSION CYCLES ═══
router.get('/commission-cycles', auth, adminOnly, async (req, res) => {
  try {
    const { partnerId, mesFechamento, status } = req.query;
    const q = {}; if (partnerId) q.partnerId = partnerId; if (mesFechamento) q.mesFechamento = mesFechamento; if (status) q.status = status;
    const cycles = await CommissionCycle.find(q).populate('partnerId', 'email responsavel.nome').sort({ cicloInicio: -1 });
    const totals = cycles.reduce((a, c) => { a.totalPagamentos += c.totalPagamentos; a.totalComissao += c.totalComissao; if (c.status === 'pago') a.totalPago += c.totalComissao; return a; }, { totalPagamentos: 0, totalComissao: 0, totalPago: 0 });
    res.json({ cycles, totals });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.get('/commission-cycle/:id', auth, adminOnly, async (req, res) => {
  try {
    const c = await CommissionCycle.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!c) return res.status(404).json({ error: 'Não encontrado.' });
    res.json(c);
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.put('/commission-cycle/:id/status', auth, adminOnly, [body('status').isIn(['calculado', 'fechado', 'nfe_pendente', 'nfe_enviada', 'pago', 'cancelado'])], async (req, res) => {
  try {
    const c = await CommissionCycle.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Não encontrado.' });
    c.status = req.body.status;
    if (req.body.status === 'pago') c.dataPagamento = req.body.dataPagamento || new Date();
    if (req.body.observacao) c.observacao = req.body.observacao;
    c.statusHistory.push({ status: req.body.status, changedBy: req.user._id, changedAt: new Date(), observacao: req.body.observacao || '' });
    await c.save();
    res.json({ message: 'Ciclo atualizado.', cycle: c });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.post('/commission-cycle/:id/comprovante', auth, adminOnly, uploadComprov.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório.' });
    const c = await CommissionCycle.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Não encontrado.' });
    c.comprovante = { path: req.file.path, nomeArquivo: req.file.originalname, dataEnvio: new Date() };
    if (c.status !== 'pago') { c.status = 'pago'; c.dataPagamento = new Date(); }
    c.statusHistory.push({ status: 'pago', changedBy: req.user._id, changedAt: new Date(), observacao: 'Comprovante anexado.' });
    await c.save();
    res.json({ message: 'Comprovante anexado.', cycle: c });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.post('/commission-calculate', auth, adminOnly, async (req, res) => {
  try {
    const results = await CommissionCron.calculateAll(req.body.referenceDate ? new Date(req.body.referenceDate) : new Date());
    res.json({ message: `${results.length} relatórios gerados.`, results });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.post('/commission-cycle/:id/recalculate', auth, adminOnly, async (req, res) => {
  try { const r = await CommissionCron.recalculate(req.params.id); res.json({ message: 'Recalculado.', cycle: r }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
