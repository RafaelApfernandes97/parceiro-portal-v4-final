const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['partner', 'admin'], default: 'partner' },
  isActive: { type: Boolean, default: false },
  activationToken: { type: String, default: null },
  responsavel: {
    nome: { type: String, default: '' }, telefone: { type: String, default: '' },
    email: { type: String, default: '' }, aniversario: { type: Date, default: null }
  },
  pagamento: {
    tipo: { type: String, enum: ['banco', 'pix'], default: 'pix' },
    banco: String, agencia: String, conta: String, chavePix: String
  },
  testemunha: { nome: String, cpf: String, email: String },
  onboardingStep: { type: String, enum: ['pending_activation', 'company_data', 'contract', 'active'], default: 'pending_activation' },
  contractSignedAt: { type: Date, default: null },
  d4signDocumentUuid: { type: String, default: null },
  lastIndicationAt: { type: Date, default: null },
  inactivityWarnings: [{ type: { type: String, enum: ['60_days', '80_days'] }, sentAt: Date }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function(p) { return bcrypt.compare(p, this.password); };
module.exports = mongoose.model('User', userSchema);
