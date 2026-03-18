const mongoose = require('mongoose');

const cyclePaymentDetail = new mongoose.Schema({
  indicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Indication', required: true },
  nomeEmpresa: String, cnpj: String,
  pagamentos: [{ paymentId: mongoose.Schema.Types.ObjectId, valor: Number, dataPagamento: Date, referencia: String }],
  subtotalPago: { type: Number, default: 0 },
  percentualComissao: { type: Number, default: 20 },
  comissaoCalculada: { type: Number, default: 0 }
}, { _id: false });

const commissionCycleSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cicloInicio: { type: Date, required: true },
  cicloFim: { type: Date, required: true },
  referencia: { type: String, required: true },
  mesFechamento: { type: String, required: true },
  detalhamento: [cyclePaymentDetail],
  totalPagamentos: { type: Number, default: 0 },
  quantidadePagamentos: { type: Number, default: 0 },
  quantidadeIndicacoes: { type: Number, default: 0 },
  percentualBase: { type: Number, default: 20 },
  totalComissao: { type: Number, default: 0 },
  status: { type: String, enum: ['calculado', 'fechado', 'nfe_pendente', 'nfe_enviada', 'pago', 'cancelado'], default: 'calculado' },
  statusHistory: [{ status: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, changedAt: { type: Date, default: Date.now }, observacao: String }],
  nfe: { path: String, nomeArquivo: String, dataEnvio: Date, numeroNfe: String, valorNfe: Number },
  comprovante: { path: String, nomeArquivo: String, dataEnvio: Date },
  dataPagamento: { type: Date, default: null },
  observacao: { type: String, default: '' }
}, { timestamps: true });

commissionCycleSchema.index({ partnerId: 1, cicloInicio: -1 });
commissionCycleSchema.index({ mesFechamento: 1 });
commissionCycleSchema.index({ status: 1 });

module.exports = mongoose.model('CommissionCycle', commissionCycleSchema);
