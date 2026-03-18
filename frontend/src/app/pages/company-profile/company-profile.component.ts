import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ESTADOS_BR } from '../../models/interfaces';

@Component({
  selector: 'app-company-profile',
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <h1>Dados da Empresa</h1>
        <p>Preencha as informações da sua empresa para gerar o contrato de parceria.</p>
        <div class="steps">
          <span class="step active">1. Dados da Empresa</span>
          <span class="step">2. Dados Auxiliares</span>
          <span class="step">3. Contrato</span>
        </div>
      </div>

      <!-- Step 1: Company Data -->
      <div *ngIf="step === 1">
        <div class="card">
          <h2>Identificação da Empresa</h2>
          <form [formGroup]="companyForm">
            <div class="field"><label>Razão Social *</label>
              <input formControlName="razaoSocial" placeholder="Razão social completa">
            </div>
            <div class="row">
              <div class="field"><label>CNPJ *</label>
                <input formControlName="cnpj" placeholder="00.000.000/0000-00" maxlength="18" (input)="maskCNPJ($event)">
              </div>
              <div class="field"><label>Inscr. Estadual</label>
                <input formControlName="inscricaoEstadual" placeholder="Isento ou número">
              </div>
            </div>
            <div class="field"><label>Endereço Completo *</label>
              <input formControlName="endereco" placeholder="Rua, número, complemento, bairro">
            </div>
            <div class="row-3">
              <div class="field"><label>Cidade *</label><input formControlName="cidade"></div>
              <div class="field"><label>Estado *</label>
                <select formControlName="estado">
                  <option value="">Selecione</option>
                  <option *ngFor="let uf of estados" [value]="uf">{{uf}}</option>
                </select>
              </div>
              <div class="field"><label>CEP *</label>
                <input formControlName="cep" placeholder="00000-000" maxlength="9" (input)="maskCEP($event)">
              </div>
            </div>

            <h2 style="margin-top:28px;">Representante Legal</h2>
            <div formGroupName="representante">
              <div class="field"><label>Nome Completo *</label><input formControlName="nome"></div>
              <div class="row">
                <div class="field"><label>CPF *</label>
                  <input formControlName="cpf" placeholder="000.000.000-00" maxlength="14" (input)="maskCPF($event)">
                </div>
                <div class="field"><label>Cargo *</label><input formControlName="cargo" placeholder="Ex: Sócio-Administrador"></div>
              </div>
            </div>

            <div class="row" style="margin-top:16px;">
              <div class="field"><label>Local da Assinatura</label><input formControlName="localAssinatura" placeholder="Ex: São Paulo/SP"></div>
              <div class="field"><label>Data do Contrato</label><input type="date" formControlName="dataContrato"></div>
            </div>
          </form>
        </div>
        <div class="actions">
          <button class="btn-primary" (click)="saveCompany()" [disabled]="saving">
            {{ saving ? 'Salvando...' : 'Continuar →' }}
          </button>
        </div>
      </div>

      <!-- Step 2: Auxiliary Data -->
      <div *ngIf="step === 2">
        <div class="card internal">
          <h2>Dados do Responsável <span class="badge">Uso Interno</span></h2>
          <form [formGroup]="auxForm">
            <div formGroupName="responsavel">
              <div class="field"><label>Nome *</label><input formControlName="nome"></div>
              <div class="row">
                <div class="field"><label>Telefone / WhatsApp *</label>
                  <input formControlName="telefone" placeholder="(00) 00000-0000" maxlength="15" (input)="maskTel($event)">
                </div>
                <div class="field"><label>E-mail *</label><input type="email" formControlName="email"></div>
              </div>
              <div class="field" style="max-width:220px;"><label>Aniversário *</label><input type="date" formControlName="aniversario"></div>
            </div>

            <h2 style="margin-top:28px;">Dados para Pagamento <span class="badge">Uso Interno</span></h2>
            <div class="toggle-bar">
              <button type="button" [class.active]="pagTipo==='banco'" (click)="pagTipo='banco'">Conta Bancária</button>
              <button type="button" [class.active]="pagTipo==='pix'" (click)="pagTipo='pix'">Chave PIX</button>
            </div>
            <div formGroupName="pagamento">
              <div *ngIf="pagTipo==='banco'">
                <div class="field"><label>Banco *</label><input formControlName="banco" placeholder="Ex: Itaú, Nubank"></div>
                <div class="row">
                  <div class="field"><label>Agência *</label><input formControlName="agencia"></div>
                  <div class="field"><label>Conta *</label><input formControlName="conta"></div>
                </div>
              </div>
              <div *ngIf="pagTipo==='pix'">
                <div class="field"><label>Chave PIX *</label><input formControlName="chavePix" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"></div>
              </div>
            </div>

            <h2 style="margin-top:28px;">Testemunha do Contrato</h2>
            <div formGroupName="testemunha">
              <div class="field"><label>Nome Completo *</label><input formControlName="nome"></div>
              <div class="row">
                <div class="field"><label>CPF *</label>
                  <input formControlName="cpf" placeholder="000.000.000-00" maxlength="14" (input)="maskCPFTest($event)">
                </div>
                <div class="field"><label>E-mail *</label><input type="email" formControlName="email"></div>
              </div>
            </div>
          </form>
        </div>
        <div class="actions">
          <button class="btn-secondary" (click)="step=1">← Voltar</button>
          <button class="btn-primary" (click)="saveAuxiliary()" [disabled]="saving">
            {{ saving ? 'Salvando...' : 'Continuar para o Contrato →' }}
          </button>
        </div>
      </div>

      <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
    </div>
  `,
  styles: [`
    .page-wrap { max-width:720px; margin:0 auto; padding:32px 24px 80px; }
    .page-header { margin-bottom:32px; }
    .page-header h1 { font-size:24px; color:#1B5E8C; margin:0 0 4px; }
    .page-header p { color:#666; font-size:14px; margin:0; }
    .steps { display:flex; gap:8px; margin-top:16px; }
    .step { font-size:12px; padding:6px 14px; border-radius:20px; background:#F2F3F4; color:#888; font-weight:600; }
    .step.active { background:#1B5E8C; color:#fff; }
    .card { background:#fff; border:1px solid #D8DEE4; border-radius:12px; padding:32px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
    .card.internal { border-left:4px solid #F39C12; }
    h2 { font-size:16px; color:#1B5E8C; margin:0 0 20px; padding-bottom:10px; border-bottom:2px solid #EAF2F8; }
    .badge { background:#FEF3E2; color:#B7791F; font-size:10px; padding:2px 8px; border-radius:10px; margin-left:8px; vertical-align:middle; }
    .field { margin-bottom:16px; }
    .field label { display:block; font-size:12px; font-weight:600; color:#5A6672; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px; }
    .field input, .field select { width:100%; padding:10px 14px; border:1.5px solid #D8DEE4; border-radius:8px; font-size:14px; background:#F7F9FB; box-sizing:border-box; }
    .field input:focus, .field select:focus { outline:none; border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,0.1); }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
    .toggle-bar { display:flex; gap:8px; margin-bottom:16px; }
    .toggle-bar button { flex:1; padding:10px; border:2px solid #D8DEE4; border-radius:8px; background:#F7F9FB; font-size:14px; font-weight:600; color:#888; cursor:pointer; }
    .toggle-bar button.active { border-color:#1B5E8C; background:#EAF2F8; color:#1B5E8C; }
    .actions { display:flex; gap:12px; justify-content:flex-end; margin-top:8px; }
    .btn-primary { padding:12px 32px; background:#1B5E8C; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; }
    .btn-primary:hover { background:#134263; }
    .btn-primary:disabled { opacity:0.7; }
    .btn-secondary { padding:12px 32px; background:#fff; color:#1B5E8C; border:2px solid #1B5E8C; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; }
    .error-msg { background:#FDEDEC; color:#C0392B; padding:12px; border-radius:8px; font-size:13px; margin-top:12px; }
    @media (max-width:640px) { .row,.row-3 { grid-template-columns:1fr; } }
  `]
})
export class CompanyProfileComponent implements OnInit {
  estados = ESTADOS_BR;
  step = 1;
  saving = false;
  errorMsg = '';
  pagTipo: 'banco' | 'pix' = 'pix';

  companyForm: FormGroup;
  auxForm: FormGroup;

  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService, private router: Router) {
    this.companyForm = this.fb.group({
      razaoSocial: ['', [Validators.required, Validators.minLength(3)]],
      cnpj: ['', [Validators.required, Validators.pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)]],
      inscricaoEstadual: ['Isento'],
      endereco: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{3}$/)]],
      representante: this.fb.group({
        nome: ['', Validators.required],
        cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
        cargo: ['', Validators.required]
      }),
      localAssinatura: [''],
      dataContrato: [new Date().toISOString().split('T')[0]]
    });

    this.auxForm = this.fb.group({
      responsavel: this.fb.group({
        nome: ['', Validators.required],
        telefone: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        aniversario: ['', Validators.required]
      }),
      pagamento: this.fb.group({
        tipo: ['pix'],
        banco: [''], agencia: [''], conta: [''], chavePix: ['']
      }),
      testemunha: this.fb.group({
        nome: ['', Validators.required],
        cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
        email: ['', [Validators.required, Validators.email]]
      })
    });
  }

  ngOnInit() {
    this.api.getProfile().subscribe({
      next: (res: any) => {
        if (res.company) {
          this.companyForm.patchValue(res.company);
          if (res.company.representante) this.companyForm.get('representante')?.patchValue(res.company.representante);
        }
        if (res.user?.responsavel?.nome) {
          this.auxForm.get('responsavel')?.patchValue(res.user.responsavel);
        }
        if (res.user?.testemunha?.nome) {
          this.auxForm.get('testemunha')?.patchValue(res.user.testemunha);
        }
        if (res.user?.pagamento) {
          this.auxForm.get('pagamento')?.patchValue(res.user.pagamento);
          this.pagTipo = res.user.pagamento.tipo || 'pix';
        }
      },
      error: () => {}
    });
  }

  saveCompany() {
    if (this.companyForm.invalid) { this.errorMsg = 'Preencha todos os campos obrigatórios.'; return; }
    this.saving = true; this.errorMsg = '';
    this.api.saveCompany(this.companyForm.value).subscribe({
      next: () => { this.saving = false; this.step = 2; window.scrollTo(0, 0); },
      error: (err) => { this.saving = false; this.errorMsg = err.error?.error || 'Erro ao salvar.'; }
    });
  }

  saveAuxiliary() {
    this.auxForm.get('pagamento')?.patchValue({ tipo: this.pagTipo });
    this.saving = true; this.errorMsg = '';
    this.api.saveAuxiliaryData(this.auxForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.auth.updateLocalUser({ onboardingStep: 'contract' });
        this.router.navigate(['/contract']);
      },
      error: (err) => { this.saving = false; this.errorMsg = err.error?.error || 'Erro ao salvar.'; }
    });
  }

  // Masks
  maskCNPJ(e: Event) { const t = e.target as HTMLInputElement; let v = t.value.replace(/\D/g,'').slice(0,14); v=v.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2'); t.value=v; this.companyForm.get('cnpj')?.setValue(v); }
  maskCPF(e: Event) { const t = e.target as HTMLInputElement; let v = t.value.replace(/\D/g,'').slice(0,11); v=v.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1-$2'); t.value=v; this.companyForm.get('representante.cpf')?.setValue(v); }
  maskCEP(e: Event) { const t = e.target as HTMLInputElement; let v = t.value.replace(/\D/g,'').slice(0,8); t.value=v.replace(/^(\d{5})(\d)/,'$1-$2'); this.companyForm.get('cep')?.setValue(t.value); }
  maskTel(e: Event) { const t = e.target as HTMLInputElement; let v = t.value.replace(/\D/g,'').slice(0,11); if(v.length>6)v=v.replace(/^(\d{2})(\d{5})(\d)/,'($1) $2-$3'); else if(v.length>2)v=v.replace(/^(\d{2})(\d)/,'($1) $2'); t.value=v; this.auxForm.get('responsavel.telefone')?.setValue(v); }
  maskCPFTest(e: Event) { const t = e.target as HTMLInputElement; let v = t.value.replace(/\D/g,'').slice(0,11); v=v.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1-$2'); t.value=v; this.auxForm.get('testemunha.cpf')?.setValue(v); }
}
