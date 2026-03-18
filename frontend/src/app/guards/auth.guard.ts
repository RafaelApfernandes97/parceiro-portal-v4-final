import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRole = route.data['role'] as string;
    if (requiredRole && this.auth.currentUser?.role !== requiredRole) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class OnboardingGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    const step = this.auth.currentUser?.onboardingStep;
    if (step === 'company_data') {
      this.router.navigate(['/company-profile']);
      return false;
    }
    if (step === 'contract') {
      this.router.navigate(['/contract']);
      return false;
    }

    return true;
  }
}
