import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, PasswordModule, ButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email_id = '';
  password = '';
  submitted = false;
  isSubmitting = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  login(): void {
    this.submitted = true;

    if (!this.email_id?.trim() || !this.password) {
      return;
    }

    this.isSubmitting = true;

    this.auth.login({
      email_id: this.email_id,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.auth.setToken(res.token);
        this.auth.setUser({
          role_id: Number(res.admin?.role_id),
          role_name: String(res.admin?.role_name ?? ''),
          email: res.admin?.email_id ?? ''
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const message = err?.error?.message || 'Invalid email or password';
        this.toast.show(message, 'error');
      }
    });
  }
}
