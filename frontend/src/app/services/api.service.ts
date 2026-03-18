import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Company, AuxiliaryData, Indication, IndicationListResponse, DashboardData } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Partner ───
  getProfile(): Observable<any> {
    return this.http.get(`${this.api}/partner/profile`);
  }

  saveCompany(data: Partial<Company>): Observable<any> {
    return this.http.post(`${this.api}/partner/company`, data);
  }

  saveAuxiliaryData(data: AuxiliaryData): Observable<any> {
    return this.http.put(`${this.api}/partner/auxiliary-data`, data);
  }

  // ─── Indication ───
  createIndication(data: Partial<Indication>): Observable<any> {
    return this.http.post(`${this.api}/indication`, data);
  }

  getIndications(page = 1, limit = 20, status?: string): Observable<IndicationListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<IndicationListResponse>(`${this.api}/indication`, { params });
  }

  // ─── Contract ───
  generateAndSign(): Observable<any> {
    return this.http.post(`${this.api}/contract/generate-and-sign`, {});
  }

  getContractStatus(): Observable<any> {
    return this.http.get(`${this.api}/contract/status`);
  }

  confirmContractSigned(): Observable<any> {
    return this.http.post(`${this.api}/contract/confirm-signed`, {});
  }

  downloadContractPdf(): Observable<Blob> {
    return this.http.get(`${this.api}/contract/pdf`, { responseType: 'blob' });
  }

  // ─── Admin ───
  getAdminDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.api}/admin/dashboard`);
  }

  getAdminPartners(): Observable<any> {
    return this.http.get(`${this.api}/admin/partners`);
  }

  getAdminIndications(page = 1, limit = 30, status?: string, search?: string, partnerId?: string): Observable<IndicationListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    if (partnerId) params = params.set('partnerId', partnerId);
    return this.http.get<IndicationListResponse>(`${this.api}/admin/indications`, { params });
  }

  updateIndicationStatus(id: string, status: string, observacao?: string): Observable<any> {
    return this.http.put(`${this.api}/admin/indication/${id}/status`, { status, observacao });
  }
}
