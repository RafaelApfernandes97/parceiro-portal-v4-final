const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { auth, partnerOnly } = require('../middleware/auth');
const { cnpjValidator, cpfValidator, nameValidator } = require('../validators/brazilian');
const User = require('../models/User');
const Company = require('../models/Company');
const emailService = require('../services/email');

router.get('/profile', auth, partnerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const company = await Company.findOne({ userId: req.user._id });
    res.json({ user, company });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

router.post('/company', auth, partnerOnly, [
  body('razaoSocial').trim().isLength({ min: 3 }),
  body('cnpj').trim().custom(cnpjValidator.options),
  body('endereco').trim().isLength({ min: 5 }),
  body('cidade').trim().isLength({ min: 2 }).custom(nameValidator.options),
  body('estado').trim().isLength({ min: 2 }),
  body('cep').trim().matches(/^\d{5}-?\d{3}$/),
  body('representante.nome').trim().custom(nameValidator.options),
  body('representante.cpf').trim().custom(cpfValidator.options),
  body('representante.cargo').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const data = { userId: req.user._id, ...req.body, isComplete: true };
    let company = await Company.findOne({ userId: req.user._id });
    if (company) { Object.assign(company, data); await company.save(); }
    else { company = new Company(data); await company.save(); }
    await User.findByIdAndUpdate(req.user._id, { onboardingStep: 'contract' });
    res.json({ message: 'Dados da empresa salvos.', company });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'CNPJ já cadastrado por outro parceiro.' });
    res.status(500).json({ error: 'Erro ao salvar.' });
  }
});

router.put('/auxiliary-data', auth, partnerOnly, [
  body('responsavel.nome').trim().custom(nameValidator.options),
  body('responsavel.telefone').trim().isLength({ min: 10 }),
  body('responsavel.email').isEmail(),
  body('responsavel.aniversario').notEmpty(),
  body('testemunha.nome').trim().custom(nameValidator.options),
  body('testemunha.cpf').trim().custom(cpfValidator.options),
  body('testemunha.email').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    await User.findByIdAndUpdate(req.user._id, { responsavel: req.body.responsavel, pagamento: req.body.pagamento, testemunha: req.body.testemunha });
    try { await emailService.sendPartnerRegistrationData(req.body); } catch (e) {}
    res.json({ message: 'Dados auxiliares salvos.' });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

// GET /api/partner/earnings-projection
router.get('/earnings-projection', auth, partnerOnly, async (req, res) => {
  try {
    const Indication = require('../models/Indication');
    const successIndications = await Indication.find({ partnerId: req.user._id, status: 'sucesso', statusValidacao: 'validada', statusCliente: 'ativo' });
    let monthlyProjection = 0;
    for (const ind of successIndications) {
      if (ind.comissionamentoFim && new Date() > new Date(ind.comissionamentoFim)) continue;
      monthlyProjection += ind.valorParcela * (ind.percentualComissao / 100);
    }
    const remainingMonths = successIndications.reduce((avg, ind) => {
      if (!ind.comissionamentoFim) return avg;
      const remaining = Math.max(0, Math.ceil((new Date(ind.comissionamentoFim) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
      return avg + remaining;
    }, 0);

    res.json({
      activeIndications: successIndications.length,
      monthlyProjection: Math.round(monthlyProjection * 100) / 100,
      annualProjection: Math.round(monthlyProjection * 12 * 100) / 100,
      avgRemainingMonths: successIndications.length > 0 ? Math.round(remainingMonths / successIndications.length) : 0
    });
  } catch (e) { res.status(500).json({ error: 'Erro.' }); }
});

module.exports = router;
