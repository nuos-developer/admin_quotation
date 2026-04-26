import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private logoutTimer: any;

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

    // 🔥 Start auto logout timer
    this.setAutoLogout(token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /* ================= CHECK LOGIN ================= */

  isLoggedIn(): boolean {
    const token = this.getToken();

    if (!token) return false;

    return !this.isTokenExpired(token);
  }

  /* ================= TOKEN EXPIRY ================= */

  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);

      const now = Math.floor(Date.now() / 1000);

      return decoded.exp < now;
    } catch {
      return true;
    }
  }

  /* ================= AUTO LOGOUT ================= */

  setAutoLogout(token: string) {
    try {
      const decoded: any = jwtDecode(token);

      const expires = decoded.exp * 1000; // ms
      const timeout = expires - Date.now();

      if (timeout <= 0) {
        this.logout();
        return;
      }

      this.logoutTimer = setTimeout(() => {
        this.logout();
      }, timeout);

    } catch {
      this.logout();
    }
  }

  /* ================= INIT CHECK ================= */

  autoLogin() {
    const token = this.getToken();

    if (!token || this.isTokenExpired(token)) {
      this.logout();
    } else {
      this.setAutoLogout(token);
    }
  }

  /* ================= LOGOUT ================= */

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }

    this.router.navigate(['/login']);
  }
}