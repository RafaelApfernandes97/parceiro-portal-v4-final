import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>MAIS CHAT</h1>
          <p>Portal de Parceiros</p>
        </div>
        <h2>Criar Conta</h2>

        <div class="success-msg" *ngIf="success">
          <strong>Cadastro realizado!</strong><br>
          Enviamos um link de ativação para <strong>{{ registeredEmail }}</strong>.<br>
          Verifique sua caixa de entrada e spam.
        </div>

        <form *ngIf="!success" [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Nome Completo</label>
            <input type="text" formControlName="nome" placeholder="Seu nome completo">
            <span class="hint" *ngIf="form.get('nome')?.touched && form.get('nome')?.errors?.['pattern']">Apenas letras, sem caracteres especiais.</span>
          </div>
          <div class="field">
            <label>E-mail</label>
            <input type="email" formControlName="email" placeholder="seu@email.com">
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" formControlName="password" placeholder="Mínimo 6 caracteres">
          </div>
          <div class="field">
            <label>Confirmar Senha</label>
            <input type="password" formControlName="confirmPassword" placeholder="Repita a senha">
            <span class="hint" *ngIf="form.get('confirmPassword')?.touched && form.errors?.['mismatch']">As senhas não coincidem.</span>
          </div>
          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Cadastrando...' : 'Cadastrar' }}
          </button>
        </form>
        <p class="auth-link">Já tem conta? <a routerLink="/login">Entrar</a></p>
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
    .hint { font-size:11px; color:#C0392B; margin-top:4px; display:block; }
    .btn-primary { width:100%; padding:14px; background:#1B5E8C; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; margin-top:8px; }
    .btn-primary:hover { background:#134263; }
    .btn-primary:disabled { opacity:0.7; cursor:wait; }
    .error-msg { background:#FDEDEC; color:#C0392B; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:12px; }
    .success-msg { background:#E8F8EF; color:#1E8449; padding:16px; border-radius:8px; font-size:14px; line-height:1.5; margin-bottom:16px; }
    .auth-link { text-align:center; margin-top:20px; font-size:14px; color:#666; }
    .auth-link a { color:#1B5E8C; font-weight:600; text-decoration:none; }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  success = false;
  registeredEmail = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-ZÀ-ÿ\s.\-']+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatch });
  }

  passwordMatch(group: FormGroup): any {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    const { nome, email, password } = this.form.value;
    this.auth.register({ nome, email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.registeredEmail = email;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.error || err.error?.errors?.[0]?.msg || 'Erro ao cadastrar.';
      }
    });
  }
}
