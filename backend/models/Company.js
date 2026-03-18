const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  razaoSocial: { type: String, required: true, trim: true },
  cnpj: { type: String, required: true, unique: true, trim: true },
  inscricaoEstadual: { type: String, default: 'Isento', trim: true },
  endereco: { type: String, required: true, trim: true },
  cidade: { type: String, required: true, trim: true },
  estado: { type: String, required: true, trim: true },
  cep: { type: String, required: true, trim: true },
  representante: { nome: { type: String, required: true }, cpf: { type: String, required: true }, cargo: { type: String, required: true } },
  dataContrato: { type: Date, default: null },
  localAssinatura: { type: String, default: '' },
  isComplete: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Company', companySchema);
