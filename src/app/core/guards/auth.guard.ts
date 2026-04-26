import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service'; // ✅ adjust path

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);
  const auth = inject(AuthService);

  // 🔥 check login + expiry
  if (!auth.isLoggedIn()) {
    auth.logout();   // auto clear + redirect
    return false;
  }

  return true;
};