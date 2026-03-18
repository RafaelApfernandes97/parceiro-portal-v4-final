const nodemailer = require('nodemailer');

class EmailService {
  constructor() { this.transporter = null; }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
      });
    }
    return this.transporter;
  }

  async verifyConnection() {
    try { await this.getTransporter().verify(); console.log('✅ SMTP: ' + process.env.SMTP_HOST); return true; }
    catch (e) { console.error('❌ SMTP:', e.message); return false; }
  }

  async send(opts) {
    const from = `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`;
    try {
      const info = await this.getTransporter().sendMail({ from, ...opts });
      console.log(`📧 ${opts.subject} → ${opts.to}`);
      return info;
    } catch (e) {
      this.transporter = null;
      try { return await this.getTransporter().sendMail({ from, ...opts }); }
      catch (e2) { console.error(`❌ Email (${opts.to}):`, e2.message); throw e2; }
    }
  }

  h(title, color = '#1B5E8C') {
    return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;"><div style="background:${color};padding:28px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:20px;">${title}</h1></div><div style="padding:28px;">`;
  }
  f() { return `</div><div style="background:#F7F9FB;padding:16px 28px;text-align:center;border-top:2px solid #EAF2F8;"><p style="color:#999;font-size:10px;margin:0;">Mais Chat Tecnologia LTDA — CNPJ 45.741.564/0001-13</p></div></div>`; }

  // 1. Activation
  async sendActivationEmail(email, token, nome) {
    const url = `${process.env.FRONTEND_URL}/activate/${token}`;
    const html = this.h('MAIS CHAT — Portal de Parceiros')
      + `<p>Olá <strong>${nome || ''}</strong>, ative sua conta:</p>`
      + `<div style="text-align:center;margin:24px 0;"><a href="${url}" style="display:inline-block;background:#1B5E8C;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;">Ativar Minha Conta</a></div>`
      + `<p style="font-size:11px;color:#aaa;word-break:break-all;">${url}</p>` + this.f();
    return this.send({ to: email, subject: 'Ative sua conta — Portal de Parceiros Mais Chat', html });
  }

  // 2. Indication notification
  async sendIndicationNotification(data, partnerName) {
    const row = (l, v) => `<tr><td style="padding:8px 12px;border:1px solid #eee;background:#EAF2F8;font-weight:600;width:140px;font-size:12px;">${l}</td><td style="padding:8px 12px;border:1px solid #eee;font-size:12px;">${v}</td></tr>`;
    const html = this.h('Nova Indicação Recebida')
      + `<p><strong>Parceiro:</strong> ${partnerName}</p><table style="width:100%;border-collapse:collapse;margin:12px 0;">`
      + row('Empresa', data.nomeEmpresa) + row('CNPJ', data.cnpj) + row('Segmento', data.segmento)
      + row('Contato', data.nomeContato) + row('E-mail', data.emailContato) + row('Telefone', data.telefoneContato || '—')
      + `</table><p style="font-size:11px;color:#888;">Status: Pendente de validação.</p>` + this.f();
    return this.send({ to: process.env.ADMIN_EMAIL, subject: `Nova Indicação: ${data.nomeEmpresa} — ${partnerName}`, html });
  }

  // 3. Indication validation result → partner
  async sendValidationResult(partnerEmail, partnerName, indication, approved, motivo) {
    const color = approved ? '#27AE60' : '#C0392B';
    const statusText = approved ? 'VALIDADA ✓' : 'REJEITADA ✕';
    const html = this.h(`Indicação ${statusText}`, color)
      + `<p>Olá <strong>${partnerName}</strong>,</p>`
      + `<p>Sua indicação <strong>${indication.nomeEmpresa}</strong> foi ${approved ? 'aceita' : 'rejeitada'} pela equipe Mais Chat.</p>`
      + (motivo ? `<p style="background:#F7F9FB;padding:10px;border-radius:8px;font-size:12px;"><strong>Motivo:</strong> ${motivo}</p>` : '')
      + (approved ? `<p style="color:#27AE60;font-weight:700;">A equipe comercial já está trabalhando nesta oportunidade!</p>` : '')
      + this.f();
    return this.send({ to: partnerEmail, subject: `Indicação ${indication.nomeEmpresa}: ${statusText}`, html });
  }

  // 4. Status change
  async sendStatusChangeToPartner(email, nome, indication, oldStatus, newStatus) {
    const labels = { nova: 'Nova', em_negociacao: 'Em Negociação', sucesso: 'Sucesso', insucesso: 'Insucesso', pausada: 'Pausada' };
    const html = this.h('Atualização de Indicação')
      + `<p>Olá <strong>${nome}</strong>,</p>`
      + `<p><strong>${indication.nomeEmpresa}</strong>: <span style="text-decoration:line-through;color:#999;">${labels[oldStatus] || oldStatus}</span> → <strong style="color:#1B5E8C;">${labels[newStatus] || newStatus}</strong></p>`
      + (indication.observacaoAdmin ? `<p style="background:#F7F9FB;padding:10px;border-radius:8px;font-size:12px;"><strong>Obs:</strong> ${indication.observacaoAdmin}</p>` : '')
      + this.f();
    return this.send({ to: email, subject: `Indicação ${indication.nomeEmpresa}: ${labels[newStatus]}`, html });
  }

  // 5. Client status change
  async sendClientStatusChangeToPartner(email, nome, indication, oldS, newS) {
    const labels = { prospect: 'Prospect', ativo: 'Ativo', inativo: 'Inativo', suspenso: 'Suspenso' };
    const html = this.h('Status do Cliente Atualizado')
      + `<p>Olá <strong>${nome}</strong>,</p>`
      + `<p>Cliente <strong>${indication.nomeEmpresa}</strong>: <strong>${labels[oldS]}</strong> → <strong>${labels[newS]}</strong></p>` + this.f();
    return this.send({ to: email, subject: `Cliente ${indication.nomeEmpresa}: ${labels[newS]}`, html });
  }

  // 6. Payment notification
  async sendPaymentNotification(email, nome, indication, payment) {
    const comissao = (payment.valor * indication.percentualComissao / 100).toFixed(2);
    const html = this.h('Pagamento Registrado', '#27AE60')
      + `<p>Olá <strong>${nome}</strong>,</p>`
      + `<p><strong>${indication.nomeEmpresa}</strong> — R$ ${payment.valor.toFixed(2)} (${payment.referencia || 'N/A'})</p>`
      + `<p>Sua comissão (${indication.percentualComissao}%): <strong style="color:#27AE60;">R$ ${comissao}</strong></p>` + this.f();
    return this.send({ to: email, subject: `Pagamento: ${indication.nomeEmpresa} — R$ ${payment.valor.toFixed(2)}`, html });
  }

  // 7. Contract copy with PDF
  async sendContractCopy(email, nome, empresa, pdfBuffer) {
    const html = this.h('Contrato de Parceria')
      + `<p>Olá <strong>${nome}</strong>, segue o contrato entre Mais Chat e <strong>${empresa}</strong>.</p>` + this.f();
    const att = pdfBuffer ? [{ filename: `Contrato_${empresa.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }] : [];
    await this.send({ to: email, subject: `Contrato de Parceria — ${empresa}`, html, attachments: att });
    await this.send({ to: process.env.ADMIN_EMAIL, subject: `[Cópia] Contrato: ${empresa}`, html, attachments: att });
  }

  // 8. Inactivity warning
  async sendInactivityWarning(email, nome, daysInactive, daysRemaining) {
    const urgency = daysRemaining <= 10 ? '#C0392B' : '#F39C12';
    const html = this.h(`Alerta de Inatividade — ${daysRemaining} dias restantes`, urgency)
      + `<p>Olá <strong>${nome}</strong>,</p>`
      + `<p>Você está há <strong>${daysInactive} dias</strong> sem enviar indicações.</p>`
      + `<p>Conforme o contrato, após <strong>90 dias</strong> sem indicação o contrato será encerrado automaticamente.</p>`
      + `<p style="font-size:14px;font-weight:700;">Você tem <strong>${daysRemaining} dias</strong> para enviar uma nova indicação.</p>`
      + `<div style="text-align:center;margin:20px 0;"><a href="${process.env.FRONTEND_URL}/indication/new" style="display:inline-block;background:#1B5E8C;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;">Fazer Uma Indicação Agora</a></div>`
      + this.f();
    return this.send({ to: email, subject: `⚠️ Alerta: ${daysRemaining} dias para encerramento do contrato`, html });
  }

  // 9. Partner registration data → admin
  async sendPartnerRegistrationData(d) {
    const html = this.h('Cadastro Auxiliar — Novo Parceiro', '#F39C12')
      + `<p><strong>Responsável:</strong> ${d.responsavel.nome} | ${d.responsavel.telefone} | ${d.responsavel.email}</p>`
      + `<p><strong>Pagamento:</strong> ${d.pagamento.tipo === 'banco' ? d.pagamento.banco + ' Ag:' + d.pagamento.agencia + ' Cc:' + d.pagamento.conta : 'PIX: ' + d.pagamento.chavePix}</p>`
      + `<p><strong>Testemunha:</strong> ${d.testemunha.nome} | CPF: ${d.testemunha.cpf} | ${d.testemunha.email}</p>` + this.f();
    return this.send({ to: process.env.ADMIN_EMAIL, subject: `Cadastro Parceiro: ${d.responsavel.nome}`, html });
  }

  // 10. Churn alert → admin
  async sendChurnAlert(indication, partnerName) {
    const html = this.h('⚠️ Alerta de Churn', '#C0392B')
      + `<p>O cliente <strong>${indication.nomeEmpresa}</strong> (indicado por ${partnerName}) mudou de status para <strong>${indication.statusCliente}</strong>.</p>`
      + `<p>Impacto: Parcela R$ ${indication.valorParcela.toFixed(2)} | Comissão mensal: R$ ${(indication.valorParcela * indication.percentualComissao / 100).toFixed(2)}</p>` + this.f();
    return this.send({ to: process.env.ADMIN_EMAIL, subject: `Churn: ${indication.nomeEmpresa} → ${indication.statusCliente}`, html });
  }
}

module.exports = new EmailService();
