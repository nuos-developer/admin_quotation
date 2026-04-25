import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LoaderService } from '../../core/services/loader.service';

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

  constructor(
    private authService: AuthService,
    public loader: LoaderService,
    private router: Router
  ) {
    this.handleRouteLoader();   // 🔥 IMPORTANT
  }

  handleRouteLoader() {
    this.router.events.subscribe(event => {

      if (event instanceof NavigationStart) {
        this.loader.show();   // 🔥 show loader on click
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loader.hide();   // 🔥 hide loader when done
      }

    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (!this.sidebarOpen) this.userMgmtOpen = false;
  }

  toggleUserMgmt() {
    this.userMgmtOpen = !this.userMgmtOpen;
  }

  logout() {
    this.authService.logout();
  }
}