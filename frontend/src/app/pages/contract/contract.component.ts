import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-contract',
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <h1>Contrato de Parceria</h1>
        <p>Revise e assine o contrato de indicação comercial.</p>
      </div>

      <div class="card" *ngIf="!sent">
        <div class="contract-info">
          <h2>Contrato de Parceria de Indicação Comercial</h2>
          <p>Ao clicar em "Assinar Contrato", o documento será enviado para assinatura digital via <strong>D4Sign</strong> para:</p>
          <ul>
            <li>Mais Chat Tecnologia (contratante)</li>
            <li>Sua empresa (parceiro)</li>
            <li>Testemunha informada no cadastro</li>
          </ul>
          <p>Todos receberão um e-mail da D4Sign com o link para assinatura.</p>
        </div>
        <div class="actions">
          <button class="btn-secondary" (click)="downloadPdf()" [disabled]="downloading">
            {{ downloading ? 'Gerando...' : '📄 Baixar PDF para Revisão' }}
          </button>
          <button class="btn-primary" (click)="signContract()" [disabled]="signing">
            {{ signing ? 'Enviando...' : '✍️ Assinar Contrato via D4Sign' }}
          </button>
        </div>
      </div>

      <div class="card success-card" *ngIf="sent && !fallback">
        <span class="icon">✓</span>
        <h2>Contrato Enviado para Assinatura!</h2>
        <p>Verifique o e-mail dos signatários para acessar o link de assinatura da D4Sign.</p>
        <p class="info">Após todas as assinaturas, seu acesso ao painel de indicações será liberado automaticamente.</p>
        <button class="btn-primary" (click)="checkStatus()">Verificar Status</button>
        <button class="btn-secondary" style="margin-top:8px;" (click)="confirmManual()">Já assinei, liberar acesso</button>
      </div>

      <div class="card warning-card" *ngIf="sent && fallback">
        <span class="icon">⚠️</span>
        <h2>PDF Gerado com Sucesso</h2>
        <p>A integração com D4Sign está temporariamente indisponível. O PDF do contrato foi baixado.</p>
        <p class="info">Assine o documento e envie para <strong>admin&#64;maischat.com</strong>.</p>
        <button class="btn-primary" (click)="confirmManual()">Já enviei o contrato assinado</button>
      </div>

      <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
    </div>
  `,
  styles: [`
    .page-wrap { max-width:640px; margin:0 auto; padding:32px 24px 80px; }
    .page-header h1 { font-size:24px; color:#1B5E8C; margin:0 0 4px; }
    .page-header p { color:#666; font-size:14px; margin:0 0 24px; }
    .card { background:#fff; border:1px solid #D8DEE4; border-radius:12px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
    .success-card { text-align:center; border-color:#27AE60; }
    .success-card .icon { color:#27AE60; font-size:48px; }
    .success-card h2 { color:#27AE60; }
    .warning-card { text-align:center; border-color:#F39C12; }
    .warning-card .icon { font-size:48px; }
    .warning-card h2 { color:#F39C12; }
    h2 { font-size:18px; color:#1B5E8C; margin:0 0 12px; }
    p { color:#555; line-height:1.6; margin-bottom:8px; }
    .info { background:#EAF2F8; padding:12px; border-radius:8px; font-size:13px; color:#134263; margin-top:12px; }
    ul { padding-left:20px; margin:8px 0 16px; color:#555; }
    ul li { margin-bottom:4px; font-size:14px; }
    .actions { display:flex; gap:12px; margin-top:24px; flex-wrap:wrap; }
    .btn-primary { padding:12px 28px; background:#1B5E8C; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; }
    .btn-primary:hover { background:#134263; }
    .btn-primary:disabled { opacity:0.7; }
    .btn-secondary { padding:12px 28px; background:#fff; color:#1B5E8C; border:2px solid #1B5E8C; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }
    .error-msg { background:#FDEDEC; color:#C0392B; padding:12px; border-radius:8px; font-size:13px; margin-top:16px; }
  `]
})
export class ContractComponent implements OnInit {
  sent = false;
  fallback = false;
  signing = false;
  downloading = false;
  errorMsg = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Check if already sent
    this.api.getContractStatus().subscribe({
      next: (res: any) => {
        if (res.status !== 'not_sent' && res.status !== 'unavailable') { this.sent = true; }
      }
    });
  }

  downloadPdf() {
    this.downloading = true;
    this.api.downloadContractPdf().subscribe({
      next: (blob: Blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Contrato_Parceria_Indicacao_MaisChat.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => { this.downloading = false; this.errorMsg = 'Erro ao gerar PDF.'; }
    });
  }

  signContract() {
    this.signing = true; this.errorMsg = '';
    this.api.generateAndSign().subscribe({
      next: (res: any) => {
        this.signing = false;
        this.sent = true;
        this.fallback = !!res.fallback;
        if (res.fallback && res.pdfBase64) {
          // Download fallback PDF
          const binary = atob(res.pdfBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'Contrato_Parceria.pdf'; a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (err) => { this.signing = false; this.errorMsg = err.error?.error || 'Erro ao enviar contrato.'; }
    });
  }

  checkStatus() {
    this.api.getContractStatus().subscribe({
      next: (res: any) => {
        if (res.status?.statusId === '4') {
          this.auth.updateLocalUser({ onboardingStep: 'active' });
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMsg = 'Aguardando assinaturas. Verifique novamente em breve.';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      }
    });
  }

  confirmManual() {
    this.api.confirmContractSigned().subscribe({
      next: () => {
        this.auth.updateLocalUser({ onboardingStep: 'active' });
        this.router.navigate(['/dashboard']);
      },
      error: () => { this.errorMsg = 'Erro ao confirmar.'; }
    });
  }
}
