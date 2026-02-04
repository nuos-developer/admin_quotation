import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /* ================= LOGIN ================= */

  login(data: any) {
    return this.http.post(`${environment.apiUrl}/admin/admin_login`, data);
  }

  /* ================= TOKEN ================= */

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /* ================= LOGOUT ================= */

  logout() {
    // Clear auth-related storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Redirect to login
    this.router.navigate(['/login']);
  }
}
