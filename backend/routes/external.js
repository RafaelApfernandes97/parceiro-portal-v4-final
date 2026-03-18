const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { apiKeyAuth, externalApiLimiter } = require('../middleware/auth');
const { validateCNPJ } = require('../validators/brazilian');
const Indication = require('../models/Indication');
const CommissionCycle = require('../models/CommissionCycle');
const User = require('../models/User');
const Company = require('../models/Company');
const emailService = require('../services/email');

router.use(externalApiLimiter);
router.use(apiKeyAuth);

router.get('/indications', async (req, res) => {
  try {
    const { status, partnerId, cnpj, statusCliente, limit = 50, page = 1 } = req.query;
    const q = {};
    if (status) q.status = status; if (partnerId) q.partnerId = partnerId;
    if (cnpj) q.cnpj = cnpj; if (statusCliente) q.statusCliente = statusCliente;
    const data = await Indication.find(q).populate('partnerId', 'email responsavel.nome').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Indication.countDocuments(q);
    res.json({ data, total, page: parseInt(page) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/indication/:id', async (req, res) => {
  try {
    const ind = await Indication.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    res.json(ind);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/indication', [body('partnerEmail').isEmail(), body('nomeEmpresa').trim().isLength({ min: 3 }), body('cnpj').trim().isLength({ min: 14 }), body('segmento').trim().isLength({ min: 2 }), body('nomeContato').trim().isLength({ min: 3 }), body('emailContato').isEmail()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (!validateCNPJ(req.body.cnpj)) return res.status(400).json({ error: 'CNPJ inválido (dígitos).' });
    const partner = await User.findOne({ email: req.body.partnerEmail.toLowerCase(), role: 'partner' });
    if (!partner) return res.status(404).json({ error: 'Parceiro não encontrado.' });
    const ind = new Indication({ partnerId: partner._id, nomeEmpresa: req.body.nomeEmpresa, cnpj: req.body.cnpj, segmento: req.body.segmento, site: req.body.site || '', nomeContato: req.body.nomeContato, emailContato: req.body.emailContato, telefoneContato: req.body.telefoneContato || '', valorParcela: req.body.valorParcela || 0, statusValidacao: 'pendente', statusHistory: [{ status: 'nova', changedAt: new Date() }] });
    await ind.save();
    res.status(201).json({ message: 'Indicação criada.', indication: ind });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/indication/:id/payment', [body('valor').isFloat({ min: 0.01 }), body('dataPagamento').isISO8601(), body('status').isIn(['paga', 'pendente', 'atrasada', 'cancelada'])], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const ind = await Indication.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    const p = { valor: req.body.valor, dataPagamento: req.body.dataPagamento, dataVencimento: req.body.dataVencimento || null, referencia: req.body.referencia || '', status: req.body.status, observacao: req.body.observacao || '', registradoPor: 'api' };
    ind.pagamentos.push(p);
    if (req.body.status === 'paga' && !ind.comissionamentoInicio) { ind.comissionamentoInicio = new Date(req.body.dataPagamento); const f = new Date(req.body.dataPagamento); f.setMonth(f.getMonth() + 12); ind.comissionamentoFim = f; }
    await ind.save();
    if (req.body.status === 'paga') { try { await emailService.sendPaymentNotification(ind.partnerId.email, ind.partnerId.responsavel?.nome || '', ind, p); } catch (e) {} }
    res.json({ message: 'Pagamento registrado via API.', indication: ind });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/indication/:id/payment/:paymentId', async (req, res) => {
  try {
    const ind = await Indication.findById(req.params.id);
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    const p = ind.pagamentos.id(req.params.paymentId);
    if (!p) return res.status(404).json({ error: 'Pagamento não encontrado.' });
    if (req.body.status) p.status = req.body.status;
    if (req.body.valor) p.valor = req.body.valor;
    if (req.body.observacao) p.observacao = req.body.observacao;
    await ind.save();
    res.json({ message: 'Pagamento atualizado.', payment: p });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/indication/:id/status', [body('status').isIn(['nova', 'em_negociacao', 'sucesso', 'insucesso', 'pausada'])], async (req, res) => {
  try {
    const ind = await Indication.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    const old = ind.status; ind.status = req.body.status;
    if (req.body.observacao) ind.observacaoAdmin = req.body.observacao;
    ind.statusHistory.push({ status: req.body.status, changedAt: new Date(), observacao: req.body.observacao || '' });
    await ind.save();
    try { await emailService.sendStatusChangeToPartner(ind.partnerId.email, ind.partnerId.responsavel?.nome || '', ind, old, req.body.status); } catch (e) {}
    res.json({ message: 'Status atualizado.', indication: ind });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/indication/:id/client-status', [body('statusCliente').isIn(['prospect', 'ativo', 'inativo', 'suspenso'])], async (req, res) => {
  try {
    const ind = await Indication.findById(req.params.id).populate('partnerId', 'email responsavel.nome');
    if (!ind) return res.status(404).json({ error: 'Não encontrada.' });
    const old = ind.statusCliente; ind.statusCliente = req.body.statusCliente;
    ind.statusClienteHistory.push({ status: req.body.statusCliente, changedAt: new Date(), observacao: req.body.observacao || '' });
    await ind.save();
    try { await emailService.sendClientStatusChangeToPartner(ind.partnerId.email, ind.partnerId.responsavel?.nome || '', ind, old, req.body.statusCliente); } catch (e) {}
    res.json({ message: 'Status cliente atualizado.', indication: ind });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/partners', async (req, res) => {
  try {
    const partners = await User.find({ role: 'partner' }).select('email responsavel onboardingStep createdAt');
    const result = await Promise.all(partners.map(async p => {
      const company = await Company.findOne({ userId: p._id });
      return { ...p.toObject(), company: company ? { razaoSocial: company.razaoSocial, cnpj: company.cnpj } : null };
    }));
    res.json({ partners: result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/commission-cycles', async (req, res) => {
  try {
    const { partnerId, mesFechamento } = req.query;
    const q = {}; if (partnerId) q.partnerId = partnerId; if (mesFechamento) q.mesFechamento = mesFechamento;
    const cycles = await CommissionCycle.find(q).populate('partnerId', 'email responsavel.nome').sort({ cicloInicio: -1 });
    res.json({ cycles });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/financial-summary', async (req, res) => {
  try {
    const { partnerId, month, year } = req.query;
    const match = {}; if (partnerId) match.partnerId = require('mongoose').Types.ObjectId(partnerId);
    const pMatch = { 'pagamentos.status': 'paga' };
    if (month && year) { const m = parseInt(month), y = parseInt(year); pMatch['pagamentos.dataPagamento'] = { $gte: new Date(y, m - 1, 16), $lte: new Date(y, m, 15) }; }
    const result = await Indication.aggregate([...(Object.keys(match).length ? [{ $match: match }] : []), { $unwind: '$pagamentos' }, { $match: pMatch }, { $group: { _id: partnerId ? null : '$partnerId', totalPago: { $sum: '$pagamentos.valor' }, totalParcelas: { $sum: 1 } } }]);
    res.json({ summary: result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
