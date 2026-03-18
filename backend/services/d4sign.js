const axios = require('axios');
const fs = require('fs');

class D4SignService {
  constructor() {
    this.baseUrl = process.env.D4SIGN_BASE_URL || 'https://secure.d4sign.com.br/api/v1';
    this.tokenAPI = process.env.D4SIGN_TOKEN_API;
    this.cryptKey = process.env.D4SIGN_CRYPT_KEY;
    this.safeUuid = process.env.D4SIGN_SAFE_UUID;
  }

  params() { return { tokenAPI: this.tokenAPI, cryptKey: this.cryptKey }; }

  async uploadDocument(pdfPath) {
    const FormData = require('form-data');
    const fd = new FormData();
    fd.append('file', fs.createReadStream(pdfPath));
    fd.append('uuid_safe', this.safeUuid);
    const r = await axios.post(`${this.baseUrl}/documents/${this.safeUuid}/upload`, fd, { params: this.params(), headers: fd.getHeaders() });
    return r.data;
  }

  async addSigners(docUuid, signers) {
    const d4s = signers.map(s => ({ email: s.email, act: '1', foreign: '0', certificadoicpbr: '0', assinatura_presencial: '0' }));
    const r = await axios.post(`${this.baseUrl}/documents/${docUuid}/createlist`, { signers: d4s }, { params: this.params() });
    return r.data;
  }

  async sendToSign(docUuid, msg = 'Contrato de Parceria — Mais Chat Tecnologia') {
    const r = await axios.post(`${this.baseUrl}/documents/${docUuid}/sendtosigner`, { message: msg, skip_email: '0', workflow: '0' }, { params: this.params() });
    return r.data;
  }

  async getStatus(docUuid) {
    const r = await axios.get(`${this.baseUrl}/documents/${docUuid}`, { params: this.params() });
    return r.data;
  }

  async registerWebhook(docUuid) {
    try {
      const webhookUrl = `${process.env.FRONTEND_URL.replace(':4200', ':3000')}/api/webhook/d4sign`;
      await axios.post(`${this.baseUrl}/documents/${docUuid}/webhooks`, { url: webhookUrl }, { params: this.params() });
      console.log(`D4Sign webhook registered for ${docUuid}`);
    } catch (e) { console.error('D4Sign webhook registration failed:', e.message); }
  }

  async createAndSendContract(pdfPath, contractName, signers) {
    const upload = await this.uploadDocument(pdfPath);
    const docUuid = upload.uuid;
    await this.addSigners(docUuid, signers);
    await this.sendToSign(docUuid);
    await this.registerWebhook(docUuid);
    return { documentUuid: docUuid, status: 'sent_for_signature' };
  }
}

module.exports = new D4SignService();
