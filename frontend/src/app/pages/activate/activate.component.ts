import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-activate',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>MAIS CHAT</h1>
          <p>Portal de Parceiros</p>
        </div>
        <div *ngIf="loading" class="status">
          <div class="spinner"></div>
          <p>Ativando sua conta...</p>
        </div>
        <div *ngIf="success" class="status success">
          <span class="icon">✓</span>
          <h2>Conta Ativada!</h2>
          <p>Redirecionando para o cadastro da empresa...</p>
        </div>
        <div *ngIf="errorMsg" class="status error">
          <span class="icon">✕</span>
          <h2>Erro na Ativação</h2>
          <p>{{ errorMsg }}</p>
          <a routerLink="/login" class="link">Ir para o Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1B5E8C,#134263); padding:24px; }
    .auth-card { background:#fff; border-radius:16px; padding:48px 40px; width:100%; max-width:420px; box-shadow:0 12px 40px rgba(0,0,0,0.2); text-align:center; }
    .auth-header h1 { font-size:28px; color:#1B5E8C; margin:0; }
    .auth-header p { font-size:13px; color:#888; margin:2px 0 32px; }
    .status p { color:#666; margin-top:8px; }
    .status h2 { margin:12px 0 0; }
    .status.success h2 { color:#27AE60; }
    .status.error h2 { color:#C0392B; }
    .icon { font-size:48px; display:block; }
    .success .icon { color:#27AE60; }
    .error .icon { color:#C0392B; }
    .link { display:inline-block; margin-top:16px; color:#1B5E8C; font-weight:600; }
    .spinner { width:40px; height:40px; border:4px solid #EAF2F8; border-top-color:#1B5E8C; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class ActivateComponent implements OnInit {
  loading = true;
  success = false;
  errorMsg = '';

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) { this.errorMsg = 'Token inválido.'; this.loading = false; return; }

    this.auth.activate(token).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/company-profile']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.error || 'Token inválido ou expirado.';
      }
    });
  }
}
