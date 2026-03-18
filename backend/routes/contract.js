const router = require('express').Router();
const { auth, partnerOnly } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const d4signService = require('../services/d4sign');
const emailService = require('../services/email');
const fs = require('fs');
const path = require('path');
const os = require('os');

// POST /api/contract/generate-and-sign
router.post('/generate-and-sign', auth, partnerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const company = await Company.findOne({ userId: req.user._id });
    if (!company || !company.isComplete) return res.status(400).json({ error: 'Complete os dados da empresa.' });
    if (!user.testemunha?.nome || !user.testemunha?.cpf || !user.testemunha?.email) return res.status(400).json({ error: 'Dados da testemunha obrigatórios.' });

    const contractHtml = generateContractHtml(company, user);
    const tmpDir = os.tmpdir();
    const htmlPath = path.join(tmpDir, `contrato_${user._id}.html`);
    const pdfPath = path.join(tmpDir, `contrato_${user._id}.pdf`);

    fs.writeFileSync(htmlPath, contractHtml);
    const htmlPdfNode = require('html-pdf-node');
    const pdfBuffer = await htmlPdfNode.generatePdf({ content: contractHtml }, { format: 'A4', margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' } });
    fs.writeFileSync(pdfPath, pdfBuffer);

    const signers = [
      { email: process.env.ADMIN_EMAIL, name: 'Mais Chat Tecnologia' },
      { email: user.email, name: company.representante.nome },
      { email: user.testemunha.email, name: user.testemunha.nome }
    ];

    let d4signResult;
    try {
      d4signResult = await d4signService.createAndSendContract(pdfPath, `Contrato_${company.razaoSocial.replace(/\s/g, '_')}`, signers);
      user.d4signDocumentUuid = d4signResult.documentUuid;
      await user.save();
    } catch (d4Err) {
      console.error('D4Sign error:', d4Err.message);
      try { await emailService.sendContractCopy(user.email, company.representante.nome, company.razaoSocial, pdfBuffer); } catch (e) {}
      cleanup(htmlPath, pdfPath);
      return res.json({ message: 'PDF gerado e enviado por e-mail. D4Sign indisponível.', pdfBase64: pdfBuffer.toString('base64'), fallback: true });
    }

    try { await emailService.sendContractCopy(user.email, company.representante.nome, company.razaoSocial, pdfBuffer); } catch (e) {}
    cleanup(htmlPath, pdfPath);

    res.json({ message: 'Contrato enviado para assinatura via D4Sign!', documentUuid: d4signResult.documentUuid, signers: signers.map(s => s.email), fallback: false });
  } catch (err) { console.error('Contract error:', err); res.status(500).json({ error: 'Erro ao gerar contrato.' }); }
});

// GET /api/contract/status
router.get('/status', auth, partnerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.d4signDocumentUuid) return res.json({ status: 'not_sent' });
    try {
      const status = await d4signService.getStatus(user.d4signDocumentUuid);
      if (status.statusId === '4') { user.contractSignedAt = new Date(); user.onboardingStep = 'active'; await user.save(); }
      return res.json({ status, documentUuid: user.d4signDocumentUuid });
    } catch (e) { return res.json({ status: 'unavailable' }); }
  } catch (err) { res.status(500).json({ error: 'Erro.' }); }
});

// POST /api/contract/confirm-signed (manual fallback)
router.post('/confirm-signed', auth, partnerOnly, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { contractSignedAt: new Date(), onboardingStep: 'active' });
    res.json({ message: 'Contrato confirmado. Painel liberado!' });
  } catch (err) { res.status(500).json({ error: 'Erro.' }); }
});

// GET /api/contract/pdf
router.get('/pdf', auth, partnerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(400).json({ error: 'Dados da empresa não encontrados.' });
    const htmlPdfNode = require('html-pdf-node');
    const pdfBuffer = await htmlPdfNode.generatePdf({ content: generateContractHtml(company, user) }, { format: 'A4', margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Contrato_Parceria_${company.cnpj.replace(/\D/g, '')}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { res.status(500).json({ error: 'Erro ao gerar PDF.' }); }
});

function cleanup(...files) { files.forEach(f => { try { fs.unlinkSync(f); } catch (e) {} }); }

function formatDateBR(date) {
  const d = new Date(date);
  const m = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return `${d.getDate()} de ${m[d.getMonth()]} de ${d.getFullYear()}`;
}

function generateContractHtml(company, user) {
  const end = `${company.endereco}, ${company.cidade}/${company.estado}, CEP ${company.cep}`;
  const data = formatDateBR(company.dataContrato || new Date());
  const t = user.testemunha || {};

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>body{font-family:'Segoe UI',Arial,sans-serif;color:#2A2A2A;line-height:1.75;font-size:13px;margin:0;padding:0}
.hd{text-align:center;margin-bottom:28px}.br{font-size:24px;font-weight:700;color:#1B5E8C}.tg{font-size:11px;color:#888;font-style:italic;margin-bottom:20px}
.tt{font-size:17px;font-weight:700;border-bottom:3px solid #1B5E8C;padding-bottom:10px;margin-bottom:4px}.st{font-size:10px;color:#999;margin-bottom:28px}
.cl{font-size:12px;font-weight:700;color:#1B5E8C;text-transform:uppercase;letter-spacing:.5px;margin-top:24px;margin-bottom:8px;padding-bottom:5px;border-bottom:2px solid #EAF2F8}
.sb{font-size:12px;font-weight:700;color:#444;margin-top:14px;margin-bottom:6px}p{text-align:justify;margin-bottom:6px}
ol{padding-left:20px;margin-bottom:6px}li{margin-bottom:3px}
table.it{width:100%;border-collapse:collapse;margin:10px 0}table.it td{padding:6px 10px;border:1px solid #D8DEE4;font-size:12px}table.it td:first-child{background:#EAF2F8;font-weight:600;width:160px;color:#134263}
.sg{display:flex;justify-content:space-between;margin-top:36px;gap:40px}.sb2{text-align:center;flex:1}.sl{border-bottom:1px solid #333;margin-bottom:5px;height:40px}.sn{font-size:11px;font-weight:700}.sr{font-size:10px;color:#666}.dl{text-align:center;margin-top:28px}
</style></head><body>
<div class="hd"><div class="br">MAIS CHAT TECNOLOGIA</div><div class="tg">Mais diálogos, mais dados, mais negócios</div>
<div class="tt">CONTRATO DE PARCERIA DE INDICAÇÃO COMERCIAL</div>
<div class="st">Termos e Condições para Programa de Indicação de Clientes com Comissionamento Recorrente</div></div>

<div class="cl">Cláusula 1 — Das Partes</div>
<p><strong>CONTRATANTE:</strong> MAIS CHAT TECNOLOGIA LTDA., CNPJ 45.741.564/0001-13, Av. Paulista, 1636 — Sala 1504, Bela Vista, São Paulo/SP, CEP 01310-200, doravante "MAIS CHAT".</p>
<p><strong>PARCEIRO INDICADOR:</strong> ${company.razaoSocial.toUpperCase()}, CNPJ ${company.cnpj}, ${end}, representada por ${company.representante.nome}, ${company.representante.cargo}, doravante "PARCEIRO".</p>

<div class="cl">Cláusula 2 — Do Objeto</div>
<p>Parceria de indicação comercial com comissão recorrente conforme termos aqui definidos. Natureza exclusivamente de indicação, sem configurar emprego, sociedade, representação comercial ou franquia.</p>

<div class="cl">Cláusula 3 — Da Não Exclusividade</div>
<p>Sem exclusividade. PARCEIRO não terá gestão sobre carteira de clientes indicados.</p>

<div class="cl">Cláusula 4 — Do Processo de Indicação</div>
<p>Indicações formalizadas pelo canal oficial. Válida após aceite formal da MAIS CHAT (verificação de negociação prévia, cliente ativo/inativo &lt;6 meses, indicação anterior). Negociação, implantação e suporte exclusivos da MAIS CHAT.</p>

<div class="cl">Cláusula 5 — Da Comissão</div>
<div class="sb">5.1. Percentual e Base de Cálculo</div>
<p>Comissão de 20% do valor líquido da mensalidade paga. Devida somente após confirmação do pagamento integral.</p>
<div class="sb">5.2. Período de Comissionamento</div>
<p>Máximo 12 meses a partir do 1º pagamento. Sem renovação para mesma indicação.</p>
<div class="sb">5.3. Fechamento e Pagamento</div>
<table class="it"><tr><td>Fechamento</td><td>Dia 15 de cada mês</td></tr><tr><td>Pagamento</td><td>Dia 25 do mesmo mês</td></tr><tr><td>Documento Fiscal</td><td>NF-e de Serviços entre dia 15 e 25</td></tr></table>
<div class="sb">5.4. Estornos e Devoluções</div>
<p>Devoluções ao cliente serão estornadas no próximo fechamento.</p>
<div class="sb">5.5. Inadimplência do Cliente</div>
<p>Plataforma SaaS com créditos: inadimplência &gt;20 dias rescinde o contrato do cliente e cessa comissões.</p>

<div class="cl">Cláusula 6 — Da Propriedade Intelectual</div>
<p>Materiais da MAIS CHAT são de propriedade exclusiva. Vedado uso parcial/total para outros fins, reprodução sem autorização, ou uso após término.</p>

<div class="cl">Cláusula 7 — Obrigações do Parceiro</div>
<p>Indicações éticas; não fazer promessas em nome da MAIS CHAT; não intervir em negociações/suporte; sigilo; emitir NF-e no prazo; não usar spam.</p>

<div class="cl">Cláusula 8 — Obrigações da Mais Chat</div>
<p>Retorno sobre indicações; negociações com profissionalismo; relatório mensal; pagamentos nos prazos; materiais de divulgação.</p>

<div class="cl">Cláusula 9 — Ausência de Vínculo Trabalhista</div>
<p>Sem vínculo empregatício ou subordinação. PARCEIRO é único responsável por obrigações trabalhistas/fiscais de sua equipe. MAIS CHAT não se responsabiliza por promessas do PARCEIRO a terceiros.</p>

<div class="cl">Cláusula 10 — Confidencialidade</div>
<p>Sigilo por 24 meses após término do contrato.</p>

<div class="cl">Cláusula 11 — LGPD</div>
<p>Cumprimento da Lei 13.709/2018. Consentimento dos titulares antes de compartilhar dados.</p>

<div class="cl">Cláusula 12 — Vigência e Rescisão</div>
<p>12 meses, renovável por aditivo. Rescisão com 30 dias de antecedência, por descumprimento, falência ou mútuo acordo. Inatividade &gt;90 dias encerra automaticamente. Comissões de indicações efetivadas continuam até completar 12 meses.</p>

<div class="cl">Cláusula 13 — Disposições Gerais</div>
<p>Vedada cessão sem consentimento. Percentual de comissão inalterado durante vigência.</p>

<div class="cl">Cláusula 14 — Do Foro</div>
<p>Comarca da Capital de São Paulo/SP.</p>

<p style="margin-top:20px">E, por estarem assim justas e contratadas, as partes assinam o presente instrumento.</p>
<div class="dl">${company.localAssinatura || 'São Paulo/SP'}, ${data}.</div>

<div class="sg"><div class="sb2"><div class="sl"></div><div class="sn">MAIS CHAT TECNOLOGIA LTDA.</div><div class="sr">Contratante</div></div>
<div class="sb2"><div class="sl"></div><div class="sn">${company.razaoSocial.toUpperCase()}</div><div class="sr">Parceiro</div></div></div>

<p style="margin-top:32px;font-weight:700;font-size:11px;">TESTEMUNHA:</p>
<div style="max-width:300px;margin-top:12px"><div class="sl"></div>
<div class="sn">${t.nome || '________________________'}</div>
<div class="sr">CPF: ${t.cpf || '________________________'} | E-mail: ${t.email || '________________________'}</div></div>
</body></html>`;
}

module.exports = router;
