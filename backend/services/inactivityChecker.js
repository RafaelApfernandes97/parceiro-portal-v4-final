const cron = require('node-cron');
const User = require('../models/User');
const Indication = require('../models/Indication');
const emailService = require('./email');

class InactivityChecker {

  static async checkAll() {
    console.log('🔍 Verificando inatividade de parceiros...');
    const partners = await User.find({ role: 'partner', onboardingStep: 'active' });
    let warnings60 = 0, warnings80 = 0, terminated = 0;

    for (const partner of partners) {
      try {
        const lastIndication = await Indication.findOne({ partnerId: partner._id }).sort({ createdAt: -1 });
        const referenceDate = lastIndication ? new Date(lastIndication.createdAt) : new Date(partner.createdAt);
        const daysInactive = Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

        const alreadySent = (type) => partner.inactivityWarnings?.some(w => w.type === type);

        // 60 days warning
        if (daysInactive >= 60 && daysInactive < 80 && !alreadySent('60_days')) {
          try {
            await emailService.sendInactivityWarning(partner.email, partner.responsavel?.nome || '', daysInactive, 90 - daysInactive);
            partner.inactivityWarnings.push({ type: '60_days', sentAt: new Date() });
            await partner.save();
            warnings60++;
          } catch (e) { console.error(`  Email 60d ${partner.email}:`, e.message); }
        }

        // 80 days warning
        if (daysInactive >= 80 && daysInactive < 90 && !alreadySent('80_days')) {
          try {
            await emailService.sendInactivityWarning(partner.email, partner.responsavel?.nome || '', daysInactive, 90 - daysInactive);
            partner.inactivityWarnings.push({ type: '80_days', sentAt: new Date() });
            await partner.save();
            warnings80++;
          } catch (e) { console.error(`  Email 80d ${partner.email}:`, e.message); }
        }

        // 90 days auto-termination (log only, manual action recommended)
        if (daysInactive >= 90) {
          console.log(`  ⛔ ${partner.email}: ${daysInactive} dias inativo — CONTRATO VENCIDO`);
          terminated++;
          // Note: actual termination should be a manual admin action
          // Here we just log and could update a field
        }
      } catch (e) { console.error(`  Erro ${partner.email}:`, e.message); }
    }

    console.log(`  Avisos 60d: ${warnings60} | Avisos 80d: ${warnings80} | Vencidos: ${terminated}`);
  }

  // Run daily at 08:00
  static start() {
    cron.schedule('0 8 * * *', async () => {
      await this.checkAll().catch(e => console.error('Inactivity cron error:', e));
    }, { timezone: 'America/Sao_Paulo' });
    console.log('⏰ Verificação inatividade: diária às 08:00 BRT');
  }
}

module.exports = InactivityChecker;
