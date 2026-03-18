import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SEGMENTOS } from '../../models/interfaces';

@Component({
  selector: 'app-indication-form',
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <h1>Nova Indicação</h1>
        <p>Indique uma empresa para a Mais Chat e ganhe comissão recorrente.</p>
      </div>

      <div class="card" *ngIf="!success">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field"><label>Nome da Empresa *</label>
            <input formControlName="nomeEmpresa" placeholder="Razão social ou nome fantasia">
          </div>
          <div class="row">
            <div class="field"><label>CNPJ *</label>
              <input formControlName="cnpj" placeholder="00.000.000/0000-00" maxlength="18" (input)="maskCNPJ($event)">
            </div>
            <div class="field"><label>Segmento *</label>
              <select formControlName="segmento">
                <option value="">Selecione</option>
                <option *ngFor="let s of segmentos" [value]="s">{{s}}</option>
              </select>
            </div>
          </div>
          <div class="field"><label>Site</label>
            <input formControlName="site" placeholder="https://www.empresa.com.br">
          </div>
          <div class="field"><label>Nome do Contato *</label>
            <input formControlName="nomeContato" placeholder="Nome da pessoa de contato">
          </div>
          <div class="row">
            <div class="field"><label>E-mail do Contato *</label>
              <input type="email" formControlName="emailContato" placeholder="contato@empresa.com">
            </div>
            <div class="field"><label>Telefone do Contato</label>
              <input formControlName="telefoneContato" placeholder="(00) 00000-0000" maxlength="15" (input)="maskTel($event)">
            </div>
          </div>
          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
          <div class="actions">
            <button type="button" class="btn-secondary" routerLink="/dashboard">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="loading">
              {{ loading ? 'Enviando...' : 'Enviar Indicação' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card success-card" *ngIf="success">
        <span class="icon">✓</span>
        <h2>Indicação Enviada!</h2>
        <p><strong>{{ sentEmpresa }}</strong> foi indicada com sucesso.</p>
        <p>A equipe da Mais Chat entrará em contato com a empresa indicada.</p>
        <div class="actions" style="justify-content:center;">
          <button class="btn-primary" (click)="reset()">Nova Indicação</button>
          <button class="btn-secondary" routerLink="/indications">Ver Indicações</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { max-width:640px; margin:0 auto; padding:32px 24px 80px; }
    .page-header h1 { font-size:24px; color:#1B5E8C; margin:0 0 4px; }
    .page-header p { color:#666; font-size:14px; margin:0 0 24px; }
    .card { background:#fff; border:1px solid #D8DEE4; border-radius:12px; padding:32px; }
    .success-card { text-align:center; border-color:#27AE60; }
    .success-card .icon { font-size:48px; color:#27AE60; display:block; margin-bottom:8px; }
    .success-card h2 { color:#27AE60; }
    .field { margin-bottom:16px; }
    .field label { display:block; font-size:12px; font-weight:600; color:#5A6672; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px; }
    .field input, .field select { width:100%; padding:10px 14px; border:1.5px solid #D8DEE4; border-radius:8px; font-size:14px; background:#F7F9FB; box-sizing:border-box; }
    .field input:focus, .field select:focus { outline:none; border-color:#1B5E8C; background:#fff; }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .actions { display:flex; gap:12px; justify-content:flex-end; margin-top:20px; }
    .btn-primary { padding:12px 28px; background:#1B5E8C; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; }
    .btn-primary:disabled { opacity:0.7; }
    .btn-secondary { padding:12px 28px; background:#fff; color:#1B5E8C; border:2px solid #1B5E8C; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; text-decoration:none; }
    .error-msg { background:#FDEDEC; color:#C0392B; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:8px; }
    @media (max-width:640px) { .row { grid-template-columns:1fr; } }
  `]
})
export class IndicationFormComponent {
  segmentos = SEGMENTOS;
  form: FormGroup;
  loading = false;
  errorMsg = '';
  success = false;
  sentEmpresa = '';

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    this.form = this.fb.group({
      nomeEmpresa: ['', [Validators.required, Validators.minLength(3)]],
      cnpj: ['', [Validators.required, Validators.pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)]],
      segmento: ['', Validators.required],
      site: [''],
      nomeContato: ['', [Validators.required, Validators.minLength(3)]],
      emailContato: ['', [Validators.required, Validators.email]],
      telefoneContato: ['']
    });
  }

  onSubmit() {
    if (this.form.invalid) { this.errorMsg = 'Preencha todos os campos obrigatórios.'; return; }
    this.loading = true; this.errorMsg = '';
    this.api.createIndication(this.form.value).subscribe({
      next: () => { this.loading = false; this.success = true; this.sentEmpresa = this.form.value.nomeEmpresa; },
      error: (err) => { this.loading = false; this.errorMsg = err.error?.error || 'Erro ao enviar indicação.'; }
    });
  }

  reset() { this.success = false; this.form.reset(); }

  maskCNPJ(e: Event) { const t=e.target as HTMLInputElement; let v=t.value.replace(/\D/g,'').slice(0,14); v=v.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2'); t.value=v; this.form.get('cnpj')?.setValue(v); }
  maskTel(e: Event) { const t=e.target as HTMLInputElement; let v=t.value.replace(/\D/g,'').slice(0,11); if(v.length>6)v=v.replace(/^(\d{2})(\d{5})(\d)/,'($1) $2-$3'); else if(v.length>2)v=v.replace(/^(\d{2})(\d)/,'($1) $2'); t.value=v; this.form.get('telefoneContato')?.setValue(v); }
}
