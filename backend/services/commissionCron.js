const cron = require('node-cron');
const Indication = require('../models/Indication');
const CommissionCycle = require('../models/CommissionCycle');
const User = require('../models/User');

class CommissionCron {
  static getCycleDates(ref = new Date()) {
    const d = new Date(ref);
    const cicloFim = new Date(d.getFullYear(), d.getMonth(), 15, 23, 59, 59, 999);
    const cicloInicio = new Date(d.getFullYear(), d.getMonth() - 1, 16, 0, 0, 0, 0);
    const mesFechamento = String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    return { cicloInicio, cicloFim, mesFechamento };
  }

  static formatRef(a, b) {
    const f = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return `${f(a)} a ${f(b)}`;
  }

  static async calculateAll(ref = new Date()) {
    const { cicloInicio, cicloFim, mesFechamento } = this.getCycleDates(ref);
    const referencia = this.formatRef(cicloInicio, cicloFim);
    console.log(`\n📊 Comissões: ${referencia}`);
    const partners = await User.find({ role: 'partner', onboardingStep: 'active' });
    const results = [];
    for (const p of partners) {
      try {
        const r = await this.calculateForPartner(p._id, cicloInicio, cicloFim, referencia, mesFechamento);
        if (r) results.push(r);
      } catch (e) { console.error(`  ❌ ${p.email}: ${e.message}`); }
    }
    console.log(`✅ ${results.length} relatórios gerados\n`);
    return results;
  }

  static async calculateForPartner(partnerId, cicloInicio, cicloFim, referencia, mesFechamento) {
    const existing = await CommissionCycle.findOne({ partnerId, mesFechamento });
    if (existing) return null;

    const indications = await Indication.find({
      partnerId, status: 'sucesso', statusValidacao: 'validada',
      'pagamentos.status': 'paga'
    });

    const detalhamento = [];
    let totalPagamentos = 0, totalComissao = 0, quantidadePagamentos = 0;

    for (const ind of indications) {
      const pagos = ind.pagamentos.filter(p =>
        p.status === 'paga' && new Date(p.dataPagamento) >= cicloInicio && new Date(p.dataPagamento) <= cicloFim
      );
      if (!pagos.length) continue;
      if (ind.comissionamentoFim && cicloFim > new Date(ind.comissionamentoFim)) continue;

      const sub = pagos.reduce((s, p) => s + p.valor, 0);
      const com = sub * (ind.percentualComissao / 100);
      detalhamento.push({
        indicationId: ind._id, nomeEmpresa: ind.nomeEmpresa, cnpj: ind.cnpj,
        pagamentos: pagos.map(p => ({ paymentId: p._id, valor: p.valor, dataPagamento: p.dataPagamento, referencia: p.referencia || '' })),
        subtotalPago: sub, percentualComissao: ind.percentualComissao, comissaoCalculada: com
      });
      totalPagamentos += sub; totalComissao += com; quantidadePagamentos += pagos.length;
    }

    if (!detalhamento.length) return null;

    const cycle = new CommissionCycle({
      partnerId, cicloInicio, cicloFim, referencia, mesFechamento, detalhamento,
      totalPagamentos, quantidadePagamentos, quantidadeIndicacoes: detalhamento.length,
      percentualBase: 20, totalComissao, status: 'calculado',
      statusHistory: [{ status: 'calculado', changedAt: new Date(), observacao: 'Gerado automaticamente.' }]
    });
    await cycle.save();
    console.log(`  💰 ${partnerId}: R$ ${totalComissao.toFixed(2)} (${detalhamento.length} ind, ${quantidadePagamentos} parcelas)`);
    return cycle;
  }

  static async recalculate(cycleId) {
    const c = await CommissionCycle.findById(cycleId);
    if (!c) throw new Error('Ciclo não encontrado.');
    if (c.status === 'pago') throw new Error('Ciclo já pago.');
    const { partnerId, cicloInicio, cicloFim, referencia, mesFechamento } = c;
    await CommissionCycle.findByIdAndDelete(cycleId);
    return this.calculateForPartner(partnerId, cicloInicio, cicloFim, referencia, mesFechamento);
  }

  // Check for missed cycles on startup
  static async checkMissedCycles() {
    const now = new Date();
    // If we're past day 16, check if current month's cycle was generated
    if (now.getDate() >= 16) {
      const { mesFechamento } = this.getCycleDates(now);
      const existingCount = await CommissionCycle.countDocuments({ mesFechamento });
      if (existingCount === 0) {
        console.log(`⚠️ Ciclo ${mesFechamento} não encontrado. Executando cálculo de recuperação...`);
        await this.calculateAll(now);
      }
    }
  }

  // Schedule with node-cron: every day 16 at 06:00
  static start() {
    cron.schedule('0 6 16 * *', async () => {
      console.log('⏰ Cron disparado: calculando comissões...');
      await this.calculateAll(new Date()).catch(e => console.error('Cron error:', e));
    }, { timezone: 'America/Sao_Paulo' });
    console.log('⏰ Cron comissões: dia 16 às 06:00 BRT (node-cron)');

    // Check on startup
    this.checkMissedCycles().catch(e => console.error('Startup check error:', e));
  }
}

module.exports = CommissionCron;
