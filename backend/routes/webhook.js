const router = require('express').Router();
const User = require('../models/User');

// POST /api/webhook/d4sign — D4Sign calls this when document is signed
router.post('/d4sign', async (req, res) => {
  try {
    // Verify webhook secret
    const secret = req.header('X-D4Sign-Webhook-Secret') || req.body.secret;
    if (secret !== process.env.D4SIGN_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Webhook secret inválido.' });
    }

    const { uuid, type_post } = req.body;
    // type_post: "1" = document signed by someone, "4" = all signed

    if (!uuid) return res.status(400).json({ error: 'UUID não fornecido.' });

    // Find user with this document UUID
    const user = await User.findOne({ d4signDocumentUuid: uuid });
    if (!user) {
      console.log(`D4Sign webhook: UUID ${uuid} não encontrado no sistema.`);
      return res.json({ received: true, status: 'uuid_not_found' });
    }

    // If all signed (type_post 4), activate partner
    if (type_post === '4' || type_post === 4) {
      user.contractSignedAt = new Date();
      user.onboardingStep = 'active';
      await user.save();
      console.log(`✅ D4Sign: Contrato assinado por todos. Parceiro ${user.email} ativado.`);

      // Send notification
      const emailService = require('../services/email');
      try {
        await emailService.send({
          to: user.email,
          subject: 'Contrato assinado! Seu painel está liberado — Mais Chat',
          html: emailService.h('Contrato Assinado ✓', '#27AE60')
            + `<p>Olá <strong>${user.responsavel?.nome || ''}</strong>,</p>`
            + `<p>Todos os signatários assinaram o contrato. Seu acesso ao painel de indicações está <strong>liberado</strong>!</p>`
            + `<div style="text-align:center;margin:20px 0;"><a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#27AE60;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;">Acessar Meu Painel</a></div>`
            + emailService.f()
        });
      } catch (e) {}
    } else {
      console.log(`D4Sign webhook: Assinatura parcial para UUID ${uuid} (type: ${type_post})`);
    }

    res.json({ received: true, status: 'processed' });
  } catch (err) {
    console.error('D4Sign webhook error:', err);
    res.status(500).json({ error: 'Erro ao processar webhook.' });
  }
});

module.exports = router;
