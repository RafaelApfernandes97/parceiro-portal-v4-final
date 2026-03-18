import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { STATUS_LABELS } from '../../models/interfaces';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <h1>Painel Administrativo</h1>
        <p>Gerencie parceiros e indicações da Mais Chat.</p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button [class.active]="tab==='dashboard'" (click)="tab='dashboard'">Dashboard</button>
        <button [class.active]="tab==='indications'" (click)="tab='indications';loadIndications()">Indicações</button>
        <button [class.active]="tab==='partners'" (click)="tab='partners';loadPartners()">Parceiros</button>
      </div>

      <!-- Dashboard Tab -->
      <div *ngIf="tab==='dashboard'">
        <div class="stats-grid">
          <div class="stat-card"><span class="num">{{ dashboard.totalPartners }}</span><span class="lbl">Parceiros</span></div>
          <div class="stat-card"><span class="num">{{ dashboard.activePartners }}</span><span class="lbl">Ativos</span></div>
          <div class="stat-card"><span class="num">{{ dashboard.totalIndications }}</span><span class="lbl">Indicações</span></div>
          <div class="stat-card success"><span class="num">{{ dashboard.statusBreakdown?.['sucesso'] || 0 }}</span><span class="lbl">Sucesso</span></div>
        </div>

        <div class="card" *ngIf="dashboard.recentIndications?.length">
          <h2>Últimas Indicações</h2>
          <table>
            <thead><tr><th>Data</th><th>Empresa</th><th>CNPJ</th><th>Parceiro</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let i of dashboard.recentIndications">
                <td>{{ i.createdAt | date:'dd/MM/yy' }}</td>
                <td class="bold">{{ i.nomeEmpresa }}</td>
                <td>{{ i.cnpj }}</td>
                <td>{{ i.partnerId?.responsavel?.nome || i.partnerId?.email }}</td>
                <td><span class="badge" [style.background]="getBg(i.status)" [style.color]="getColor(i.status)">{{ getLabel(i.status) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Indications Tab -->
      <div *ngIf="tab==='indications'">
        <div class="toolbar">
          <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar empresa, CNPJ ou contato..." (keyup.enter)="loadIndications()">
          <select [(ngModel)]="filterStatus" (change)="loadIndications()">
            <option value="">Todos os Status</option>
            <option *ngFor="let s of statusKeys" [value]="s">{{ getLabel(s) }}</option>
          </select>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Empresa</th><th>CNPJ</th><th>Segmento</th><th>Contato</th><th>Parceiro</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              <tr *ngFor="let i of indications">
                <td>{{ i.createdAt | date:'dd/MM/yy' }}</td>
                <td class="bold">{{ i.nomeEmpresa }}</td>
                <td>{{ i.cnpj }}</td>
                <td>{{ i.segmento }}</td>
                <td>{{ i.nomeContato }}<br><small>{{ i.emailContato }}</small></td>
                <td>{{ i.partnerId?.responsavel?.nome || '—' }}</td>
                <td>
                  <select class="status-select" [value]="i.status" (change)="onStatusChange(i, $event)">
                    <option *ngFor="let s of statusKeys" [value]="s" [selected]="s===i.status">{{ getLabel(s) }}</option>
                  </select>
                </td>
                <td>
                  <button class="btn-mini" (click)="openObs(i)" title="Observação">💬</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" *ngIf="indTotalPages > 1">
          <button [disabled]="indPage<=1" (click)="indPage=indPage-1;loadIndications()">←</button>
          <span>{{ indPage }}/{{ indTotalPages }}</span>
          <button [disabled]="indPage>=indTotalPages" (click)="indPage=indPage+1;loadIndications()">→</button>
        </div>
      </div>

      <!-- Partners Tab -->
      <div *ngIf="tab==='partners'">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Empresa</th><th>CNPJ</th><th>Indicações</th><th>Status Conta</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of partners">
                <td class="bold">{{ p.responsavel?.nome || '—' }}</td>
                <td>{{ p.email }}</td>
                <td>{{ p.company?.razaoSocial || '—' }}</td>
                <td>{{ p.company?.cnpj || '—' }}</td>
                <td>{{ p.totalIndications }}</td>
                <td><span class="badge" [style.background]="p.onboardingStep==='active'?'#E8F8EF':'#FEF3E2'" [style.color]="p.onboardingStep==='active'?'#27AE60':'#B7791F'">{{ p.onboardingStep }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Observation Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="showModal=false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Observação — {{ selectedIndication?.nomeEmpresa }}</h3>
          <textarea [(ngModel)]="obsText" rows="4" placeholder="Adicionar observação..."></textarea>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="showModal=false">Cancelar</button>
            <button class="btn-primary" (click)="saveObs()">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { max-width:1100px; margin:0 auto; padding:32px 24px 80px; }
    .page-header h1 { font-size:24px; color:#1B5E8C; margin:0 0 4px; }
    .page-header p { color:#666; font-size:14px; margin:0 0 20px; }
    .tabs { display:flex; gap:4px; margin-bottom:24px; border-bottom:2px solid #D8DEE4; }
    .tabs button { padding:10px 20px; border:none; background:none; font-size:14px; font-weight:600; color:#888; cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; }
    .tabs button.active { color:#1B5E8C; border-bottom-color:#1B5E8C; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
    .stat-card { background:#fff; border:1px solid #D8DEE4; border-radius:12px; padding:20px; text-align:center; }
    .num { display:block; font-size:32px; font-weight:700; color:#1B5E8C; }
    .stat-card.success .num { color:#27AE60; }
    .lbl { font-size:12px; color:#888; text-transform:uppercase; }
    .card { background:#fff; border:1px solid #D8DEE4; border-radius:12px; padding:24px; overflow-x:auto; }
    h2 { font-size:16px; color:#1B5E8C; margin:0 0 16px; }
    .toolbar { display:flex; gap:12px; margin-bottom:16px; }
    .toolbar input { flex:1; padding:10px 14px; border:1.5px solid #D8DEE4; border-radius:8px; font-size:14px; }
    .toolbar select { padding:10px; border:1.5px solid #D8DEE4; border-radius:8px; font-size:14px; }
    .table-wrap { overflow-x:auto; background:#fff; border:1px solid #D8DEE4; border-radius:12px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th { text-align:left; padding:10px; background:#F7F9FB; border-bottom:2px solid #D8DEE4; font-size:10px; text-transform:uppercase; color:#5A6672; letter-spacing:0.5px; }
    td { padding:8px 10px; border-bottom:1px solid #F2F3F4; color:#333; vertical-align:top; }
    td.bold { font-weight:600; }
    td small { color:#888; font-size:10px; }
    .badge { display:inline-block; padding:3px 8px; border-radius:10px; font-size:10px; font-weight:600; white-space:nowrap; }
    .status-select { padding:4px 8px; border:1px solid #D8DEE4; border-radius:6px; font-size:12px; cursor:pointer; }
    .btn-mini { border:none; background:none; cursor:pointer; font-size:16px; padding:4px; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:12px; }
    .pagination button { padding:6px 14px; border:1px solid #D8DEE4; border-radius:6px; background:#fff; cursor:pointer; }
    .pagination button:disabled { opacity:0.4; }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:#fff; border-radius:12px; padding:28px; width:90%; max-width:480px; }
    .modal h3 { font-size:16px; color:#1B5E8C; margin:0 0 12px; }
    .modal textarea { width:100%; padding:10px; border:1.5px solid #D8DEE4; border-radius:8px; font-size:14px; resize:vertical; box-sizing:border-box; }
    .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
    .btn-primary { padding:10px 24px; background:#1B5E8C; color:#fff; border:none; border-radius:8px; font-weight:700; cursor:pointer; }
    .btn-secondary { padding:10px 24px; background:#fff; color:#1B5E8C; border:2px solid #1B5E8C; border-radius:8px; font-weight:600; cursor:pointer; }
    @media (max-width:768px) { .stats-grid { grid-template-columns:repeat(2,1fr); } .toolbar { flex-direction:column; } }
  `]
})
export class AdminPanelComponent implements OnInit {
  tab = 'dashboard';
  statusKeys = ['nova', 'em_negociacao', 'sucesso', 'insucesso', 'pausada'];

  // Dashboard
  dashboard: any = { totalPartners: 0, activePartners: 0, totalIndications: 0, statusBreakdown: {}, recentIndications: [] };

  // Indications
  indications: any[] = [];
  indPage = 1;
  indTotalPages = 1;
  searchTerm = '';
  filterStatus = '';

  // Partners
  partners: any[] = [];

  // Modal
  showModal = false;
  selectedIndication: any = null;
  obsText = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadDashboard(); }

  loadDashboard() {
    this.api.getAdminDashboard().subscribe({
      next: (data) => { this.dashboard = data; }
    });
  }

  loadIndications() {
    this.api.getAdminIndications(this.indPage, 30, this.filterStatus || undefined, this.searchTerm || undefined).subscribe({
      next: (res) => {
        this.indications = res.indications;
        this.indTotalPages = res.totalPages;
      }
    });
  }

  loadPartners() {
    this.api.getAdminPartners().subscribe({
      next: (res: any) => { this.partners = res.partners; }
    });
  }

  onStatusChange(indication: any, event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value;
    this.api.updateIndicationStatus(indication._id, newStatus).subscribe({
      next: (res: any) => {
        indication.status = newStatus;
        this.loadDashboard();
      }
    });
  }

  openObs(indication: any) {
    this.selectedIndication = indication;
    this.obsText = indication.observacaoAdmin || '';
    this.showModal = true;
  }

  saveObs() {
    if (!this.selectedIndication) return;
    this.api.updateIndicationStatus(this.selectedIndication._id, this.selectedIndication.status, this.obsText).subscribe({
      next: () => {
        this.selectedIndication.observacaoAdmin = this.obsText;
        this.showModal = false;
      }
    });
  }

  getLabel(s: string) { return STATUS_LABELS[s]?.label || s; }
  getColor(s: string) { return STATUS_LABELS[s]?.color || '#333'; }
  getBg(s: string) { return STATUS_LABELS[s]?.bg || '#F2F3F4'; }
}
