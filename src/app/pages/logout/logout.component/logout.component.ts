import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service'
@Component({
  selector: 'app-logout.component',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss',
})
export class LogoutComponent {

  constructor(private authService: AuthService) {}

  logout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      this.authService.logout();
    }
  }
}
