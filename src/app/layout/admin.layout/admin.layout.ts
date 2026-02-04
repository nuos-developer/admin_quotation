import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin.layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.layout.html',
  styleUrl: './admin.layout.scss',
})
export class AdminLayout {

  sidebarOpen = true;
  userMgmtOpen = false;

  constructor(private authService: AuthService) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;

    // close submenu when collapsed
    if (!this.sidebarOpen) {
      this.userMgmtOpen = false;
    }
  }

  toggleUserMgmt() {
    this.userMgmtOpen = !this.userMgmtOpen;
  }

  logout() {
    this.authService.logout();
  }
}
