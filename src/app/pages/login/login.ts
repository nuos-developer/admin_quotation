import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email_id = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  login() {
    this.auth.login({
      email_id: this.email_id,
      password: this.password
    }).subscribe((res: any) => {
      console.log(res);
      
      localStorage.setItem('token', res.token);

      // ✅ Redirect to dashboard
      this.router.navigate(['/dashboard']);
    });
  }

  showPassword = false;

togglePassword() {
  this.showPassword = !this.showPassword;
}
}