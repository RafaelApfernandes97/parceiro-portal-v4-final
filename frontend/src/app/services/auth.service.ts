import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { User, LoginResponse, RegisterRequest } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('mc_user');
    if (userData) {
      try {
        this.currentUserSubject.next(JSON.parse(userData));
      } catch { this.logout(); }
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem('mc_token');
  }

  get isLoggedIn(): boolean {
    return !!this.token && !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  activate(token: string): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.apiUrl}/activate/${token}`).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  getMe(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        this.currentUserSubject.next(res.user);
        localStorage.setItem('mc_user', JSON.stringify(res.user));
      })
    );
  }

  private setSession(res: LoginResponse): void {
    localStorage.setItem('mc_token', res.token);
    localStorage.setItem('mc_user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  logout(): void {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  updateLocalUser(partial: Partial<User>): void {
    const current = this.currentUser;
    if (current) {
      const updated = { ...current, ...partial };
      this.currentUserSubject.next(updated);
      localStorage.setItem('mc_user', JSON.stringify(updated));
    }
  }
}
