import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { STATUS_LABELS } from '../../models/interfaces';

@Component({
  selector: 'app-indication-list',
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <h1>Minhas Indicações</h1>
        <p>Acompanhe o status de todas as suas indicações.</p>
      </div>

      <div class="filters">
        <button [class.active]="!filterStatus" (click)="filter('')">Todas ({{ total }})</button>
        <button *ngFor="let s of statusKeys" [class.active]="filterStatus===s" (click)="filter(s)"
          [style.border-color]="getColor(s)">
          {{ getLabel(s) }} ({{ stats[s] || 0 }})
        </button>
      </div>

      <div class="card" *ngIf="indications.length === 0 && !loading">
        <p class="empty">Nenhuma indicação encontrada. <a routerLink="/indication/new">Faça sua primeira indicação!</a></p>
      </div>

      <div class="table-wrap" *ngIf="indications.length > 0">
        <table>
          <thead>
            <tr><th>Data</th><th>Empresa</th><th>CNPJ</th><th>Segmento</th><th>Contato</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let ind of indications">
              <td>{{ ind.createdAt | date:'dd/MM/yyyy' }}</td>
              <td class="bold">{{ ind.nomeEmpresa }}</td>
              <td>{{ ind.cnpj }}</td>
              <td>{{ ind.segmento }}</td>
              <td>{{ ind.nomeContato }}<br><small>{{ ind.emailContato }}</small></td>
              <td><span class="badge" [style.background]="getBg(ind.status)" [style.color]="getColor(ind.status)">{{ getLabel(ind.status) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button [disabled]="page<=1" (click)="goPage(page-1)">←</button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button [disabled]="page>=totalPages" (click)="goPage(page+1)">→</button>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { max-width:1000px; margin:0 auto; padding:32px 24px 80px; }
    .page-header h1 { font-size:24px; color:#1B5E8C; margin:0 0 4px; }
    .page-header p { color:#666; font-size:14px; margin:0 0 20px; }
    .filters { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
    .filters button { padding:7px 16px; border:2px solid #D8DEE4; border-radius:20px; background:#fff; font-size:13px; font-weight:600; color:#666; cursor:pointer; }
    .filters button.active { border-color:#1B5E8C; background:#EAF2F8; color:#1B5E8C; }
    .card { background:#fff; border:1px solid #D8DEE4; border-radius:12px; padding:32px; text-align:center; }
    .empty { color:#888; font-size:15px; }
    .empty a { color:#1B5E8C; font-weight:600; }
    .table-wrap { overflow-x:auto; background:#fff; border:1px solid #D8DEE4; border-radius:12px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { text-align:left; padding:12px; background:#F7F9FB; border-bottom:2px solid #D8DEE4; font-size:11px; text-transform:uppercase; color:#5A6672; letter-spacing:0.5px; }
    td { padding:10px 12px; border-bottom:1px solid #F2F3F4; color:#333; vertical-align:top; }
    td.bold { font-weight:600; }
    td small { color:#888; font-size:11px; }
    .badge { display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:16px; }
    .pagination button { padding:8px 16px; border:1px solid #D8DEE4; border-radius:8px; background:#fff; cursor:pointer; font-weight:600; }
    .pagination button:disabled { opacity:0.4; cursor:default; }
  `]
})
export class IndicationListComponent implements OnInit {
  indications: any[] = [];
  total = 0;
  page = 1;
  totalPages = 1;
  stats: any = {};
  filterStatus = '';
  loading = false;
  statusKeys = ['nova', 'em_negociacao', 'sucesso', 'insucesso', 'pausada'];

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getIndications(this.page, 20, this.filterStatus || undefined).subscribe({
      next: (res) => {
        this.indications = res.indications;
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.stats = res.stats;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filter(status: string) { this.filterStatus = status; this.page = 1; this.load(); }
  goPage(p: number) { this.page = p; this.load(); }
  getLabel(s: string) { return STATUS_LABELS[s]?.label || s; }
  getColor(s: string) { return STATUS_LABELS[s]?.color || '#333'; }
  getBg(s: string) { return STATUS_LABELS[s]?.bg || '#F2F3F4'; }
}
