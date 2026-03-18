import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { STATUS_LABELS } from '../../models/interfaces';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="page-wrap">
      <div class="welcome">
        <h1>Olá, {{ auth.currentUser?.nome || 'Parceiro' }}!</h1>
        <p>Bem-vindo ao Portal de Parceiros da Mais Chat.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><span class="stat-num">{{ stats['total'] || 0 }}</span><span class="stat-label">Total de Indicações</span></div>
        <div class="stat-card success"><span class="stat-num">{{ stats['sucesso'] || 0 }}</span><span class="stat-label">Sucesso</span></div>
        <div class="stat-card warning"><span class="stat-num">{{ stats['em_negociacao'] || 0 }}</span><span class="stat-label">Em Negociação</span></div>
        <div class="stat-card info"><span class="stat-num">{{ stats['nova'] || 0 }}</span><span class="stat-label">Novas</span></div>
      </div>

      <div class="quick-actions">
        <a routerLink="/indication/new" class="action-card">
          <span class="action-icon">+</span>
          <span class="action-text">Nova Indicação</span>
        </a>
        <a routerLink="/indications" class="action-card">
          <span class="action-icon">📋</span>
          <span class="action-text">Ver Indicações</span>
        </a>
      </div>

      <div class="card" *ngIf="recent.length > 0">
        <h2>Indicações Recentes</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Empresa</th><th>CNPJ</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let ind of recent">
                <td>{{ ind.createdAt | date:'dd/MM/yyyy' }}</td>
                <td>{{ ind.nomeEmpresa }}</td>
                <td>{{ ind.cnpj }}</td>
                <td><span class="status-badge" [style.background]="getStatusBg(ind.status)" [style.color]="getStatusColor(ind.status)">{{ getStatusLabel(ind.status) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { max-width:900px; margin:0 auto; padding:32px 24px 80px; }
    .welcome h1 { font-size:24px; color:#1B5E8C; margin:0; }
    .welcome p { color:#666; margin:4px 0 24px; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
    .stat-card { background:#fff; border:1px solid #D8DEE4; border-radius:12px; padding:20px; text-align:center; }
    .stat-num { display:block; font-size:32px; font-weight:700; color:#1B5E8C; }
    .stat-label { font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px; }
    .stat-card.success .stat-num { color:#27AE60; }
    .stat-card.warning .stat-num { color:#F39C12; }
    .stat-card.info .stat-num { color:#1B5E8C; }
    .quick-actions { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
    .action-card { display:flex; align-items:center; gap:14px; background:#fff; border:2px solid #D8DEE4; border-radius:12px; padding:20px; text-decoration:none; transition:all 0.2s; }
    .action-card:hover { border-color:#1B5E8C; background:#EAF2F8; }
    .action-icon { font-size:28px; width:48px; height:48px; border-radius:12px; background:#EAF2F8; display:flex; align-items:center; justify-content:center; color:#1B5E8C; font-weight:700; }
    .action-text { font-size:16px; font-weight:600; color:#2A2A2A; }
    .card { background:#fff; border:1px solid #D8DEE4; border-radius:12px; padding:24px; }
    h2 { font-size:16px; color:#1B5E8C; margin:0 0 16px; }
    .table-wrap { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { text-align:left; padding:10px 12px; background:#F7F9FB; border-bottom:2px solid #D8DEE4; color:#5A6672; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
    td { padding:10px 12px; border-bottom:1px solid #F2F3F4; color:#333; }
    .status-badge { display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; }
    @media (max-width:768px) { .stats-grid { grid-template-columns:repeat(2,1fr); } .quick-actions { grid-template-columns:1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  recent: any[] = [];

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.getIndications(1, 5).subscribe({
      next: (res) => {
        this.recent = res.indications;
        this.stats = { ...res.stats, total: res.total };
      }
    });
  }

  getStatusLabel(s: string) { return STATUS_LABELS[s]?.label || s; }
  getStatusColor(s: string) { return STATUS_LABELS[s]?.color || '#333'; }
  getStatusBg(s: string) { return STATUS_LABELS[s]?.bg || '#F2F3F4'; }
}
