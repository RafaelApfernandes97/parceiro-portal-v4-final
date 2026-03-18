import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { TokenInterceptor } from './services/token.interceptor';
import { AuthGuard, OnboardingGuard } from './guards/auth.guard';

// Pages
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ActivateComponent } from './pages/activate/activate.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CompanyProfileComponent } from './pages/company-profile/company-profile.component';
import { ContractComponent } from './pages/contract/contract.component';
import { IndicationFormComponent } from './pages/indication-form/indication-form.component';
import { IndicationListComponent } from './pages/indication-list/indication-list.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'activate/:token', component: ActivateComponent },

  // Partner routes
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard, OnboardingGuard] },
  { path: 'company-profile', component: CompanyProfileComponent, canActivate: [AuthGuard] },
  { path: 'contract', component: ContractComponent, canActivate: [AuthGuard] },
  { path: 'indication/new', component: IndicationFormComponent, canActivate: [AuthGuard, OnboardingGuard] },
  { path: 'indications', component: IndicationListComponent, canActivate: [AuthGuard, OnboardingGuard] },

  // Admin routes
  { path: 'admin', component: AdminPanelComponent, canActivate: [AuthGuard], data: { role: 'admin' } },

  { path: '**', redirectTo: '/login' }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ActivateComponent,
    DashboardComponent,
    CompanyProfileComponent,
    ContractComponent,
    IndicationFormComponent,
    IndicationListComponent,
    AdminPanelComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
