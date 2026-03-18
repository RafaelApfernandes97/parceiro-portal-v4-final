import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>MAIS CHAT</h1>
          <p>Portal de Parceiros</p>
        </div>
        <h2>Entrar</h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>E-mail</label>
            <input type="email" formControlName="email" placeholder="seu@email.com">
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" formControlName="password" placeholder="Sua senha">
          </div>
          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
        <p class="auth-link">Não tem conta? <a routerLink="/register">Cadastre-se</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1B5E8C 0%,#134263 100%); padding:24px; }
    .auth-card { background:#fff; border-radius:16px; padding:48px 40px; width:100%; max-width:420px; box-shadow:0 12px 40px rgba(0,0,0,0.2); }
    .auth-header { text-align:center; margin-bottom:32px; }
    .auth-header h1 { font-size:28px; color:#1B5E8C; letter-spacing:1px; margin:0; }
    .auth-header p { font-size:13px; color:#888; margin-top:2px; }
    h2 { font-size:20px; margin-bottom:24px; color:#2A2A2A; }
    .field { margin-bottom:16px; }
    .field label { display:block; font-size:12px; font-weight:600; color:#5A6672; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
    .field input { width:100%; padding:12px 16px; border:1.5px solid #D8DEE4; border-radius:8px; font-size:15px; background:#F7F9FB; transition:all 0.2s; box-sizing:border-box; }
    .field input:focus { outline:none; border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,0.12); }
    .btn-primary { width:100%; padding:14px; background:#1B5E8C; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; transition:all 0.25s; margin-top:8px; }
    .btn-primary:hover { background:#134263; }
    .btn-primary:disabled { opacity:0.7; cursor:wait; }
    .error-msg { background:#FDEDEC; color:#C0392B; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:12px; }
    .auth-link { text-align:center; margin-top:20px; font-size:14px; color:#666; }
    .auth-link a { color:#1B5E8C; font-weight:600; text-decoration:none; }
    .auth-link a:hover { text-decoration:underline; }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn) {
      this.redirectByRole();
    }
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.auth.login(this.form.value.email, this.form.value.password).subscribe({
      next: () => {
        this.loading = false;
        this.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.error || 'Erro ao fazer login.';
      }
    });
  }

  private redirectByRole() {
    const user = this.auth.currentUser;
    if (user?.role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (user?.onboardingStep === 'company_data') {
      this.router.navigate(['/company-profile']);
    } else if (user?.onboardingStep === 'contract') {
      this.router.navigate(['/contract']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
