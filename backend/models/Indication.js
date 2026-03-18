const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  valor: { type: Number, required: true },
  dataPagamento: { type: Date, required: true },
  dataVencimento: { type: Date, default: null },
  referencia: { type: String, default: '' },
  status: { type: String, enum: ['paga', 'pendente', 'atrasada', 'cancelada'], default: 'pendente' },
  comprovante: { type: String, default: '' },
  observacao: { type: String, default: '' },
  registradoPor: { type: String, enum: ['admin', 'api'], default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const attachmentSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['proposta', 'comprovante', 'nfe', 'contrato', 'outro'], required: true },
  nome: { type: String, required: true },
  path: { type: String, required: true },
  uploadedBy: { type: String, enum: ['admin', 'partner', 'api'], default: 'admin' },
  uploadedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

const commissionAdjustSchema = new mongoose.Schema({
  percentualAnterior: Number, percentualNovo: Number,
  motivo: { type: String, required: true },
  alteradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const indicationSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nomeEmpresa: { type: String, required: true, trim: true },
  cnpj: { type: String, required: true, trim: true },
  segmento: { type: String, required: true, trim: true },
  site: { type: String, default: '', trim: true },
  nomeContato: { type: String, required: true, trim: true },
  emailContato: { type: String, required: true, lowercase: true, trim: true },
  telefoneContato: { type: String, default: '', trim: true },

  // Validação da indicação (aceite formal pela Mais Chat)
  statusValidacao: {
    type: String,
    enum: ['pendente', 'validada', 'rejeitada'],
    default: 'pendente'
  },
  motivoRejeicao: { type: String, default: '' },
  validadaEm: { type: Date, default: null },
  validadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Status comercial
  status: { type: String, enum: ['nova', 'em_negociacao', 'sucesso', 'insucesso', 'pausada'], default: 'nova' },
  statusHistory: [{ status: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, changedAt: { type: Date, default: Date.now }, observacao: { type: String, default: '' } }],
  observacaoAdmin: { type: String, default: '' },

  // Status do cliente (pós-venda)
  statusCliente: { type: String, enum: ['prospect', 'ativo', 'inativo', 'suspenso'], default: 'prospect' },
  statusClienteHistory: [{ status: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, changedAt: { type: Date, default: Date.now }, observacao: { type: String, default: '' } }],

  // Financeiro
  valorParcela: { type: Number, default: 0 },
  percentualComissao: { type: Number, default: 20 },
  commissionAdjustments: [commissionAdjustSchema],
  pagamentos: [paymentSchema],
  anexos: [attachmentSchema],
  comissionamentoInicio: { type: Date, default: null },
  comissionamentoFim: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtuals
indicationSchema.virtual('totalPago').get(function () {
  return this.pagamentos.filter(p => p.status === 'paga').reduce((s, p) => s + p.valor, 0);
});
indicationSchema.virtual('totalComissao').get(function () {
  return this.totalPago * (this.percentualComissao / 100);
});
indicationSchema.virtual('quantidadeParcelas').get(function () {
  return this.pagamentos.filter(p => p.status === 'paga').length;
});

// Indexes
indicationSchema.index({ partnerId: 1, createdAt: -1 });
indicationSchema.index({ status: 1 });
indicationSchema.index({ statusValidacao: 1 });
indicationSchema.index({ statusCliente: 1 });
indicationSchema.index({ cnpj: 1 });
indicationSchema.index({ 'pagamentos.dataPagamento': 1, 'pagamentos.status': 1 });

module.exports = mongoose.model('Indication', indicationSchema);
