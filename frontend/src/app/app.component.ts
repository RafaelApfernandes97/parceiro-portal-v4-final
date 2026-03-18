import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <nav class="navbar" *ngIf="auth.isLoggedIn">
      <div class="nav-brand" routerLink="/dashboard">
        <span class="brand-text">MAIS CHAT</span>
        <span class="brand-sub">Portal de Parceiros</span>
      </div>
      <div class="nav-links">
        <ng-container *ngIf="auth.currentUser?.role === 'partner'">
          <a routerLink="/dashboard" routerLinkActive="active">Painel</a>
          <a routerLink="/indication/new" routerLinkActive="active">Nova Indicação</a>
          <a routerLink="/indications" routerLinkActive="active">Minhas Indicações</a>
        </ng-container>
        <ng-container *ngIf="auth.currentUser?.role === 'admin'">
          <a routerLink="/admin" routerLinkActive="active">Admin</a>
        </ng-container>
      </div>
      <div class="nav-user">
        <span class="user-name">{{ auth.currentUser?.nome || auth.currentUser?.email }}</span>
        <span class="user-role" [class]="auth.currentUser?.role">{{ auth.currentUser?.role === 'admin' ? 'Admin' : 'Parceiro' }}</span>
        <button class="btn-logout" (click)="auth.logout()">Sair</button>
      </div>
    </nav>
    <main [class.has-nav]="auth.isLoggedIn">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      background: #1B5E8C; padding: 0 24px; height: 60px;
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .nav-brand { cursor: pointer; display: flex; flex-direction: column; }
    .brand-text { color: #fff; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; line-height: 1.2; }
    .brand-sub { color: #EAF2F8; font-size: 10px; opacity: 0.8; }
    .nav-links { display: flex; gap: 4px; }
    .nav-links a {
      color: rgba(255,255,255,0.8); text-decoration: none; padding: 8px 16px;
      border-radius: 6px; font-size: 14px; font-weight: 500; transition: all 0.2s;
    }
    .nav-links a:hover, .nav-links a.active { background: rgba(255,255,255,0.15); color: #fff; }
    .nav-user { display: flex; align-items: center; gap: 10px; }
    .user-name { color: #fff; font-size: 13px; font-weight: 500; }
    .user-role {
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .user-role.admin { background: #F39C12; color: #fff; }
    .user-role.partner { background: rgba(255,255,255,0.2); color: #fff; }
    .btn-logout {
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3);
      color: #fff; padding: 6px 14px; border-radius: 6px; cursor: pointer;
      font-size: 12px; font-weight: 600; transition: all 0.2s;
    }
    .btn-logout:hover { background: rgba(255,255,255,0.2); }
    main { min-height: 100vh; background: #F7F9FB; }
    main.has-nav { padding-top: 60px; }
    @media (max-width: 768px) {
      .navbar { flex-wrap: wrap; height: auto; padding: 12px; gap: 8px; }
      .nav-links { order: 3; width: 100%; justify-content: center; }
      .nav-links a { font-size: 12px; padding: 6px 10px; }
      .user-name { display: none; }
    }
  `]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
