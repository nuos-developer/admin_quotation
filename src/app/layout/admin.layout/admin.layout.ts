import { Component } from '@angular/core';

import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError
} from '@angular/router';

import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';

import { LoaderService } from '../../core/services/loader.service';


@Component({
  selector: 'app-admin-layout',

  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],

  templateUrl: './admin.layout.html',

  styleUrl: './admin.layout.scss'
})
export class AdminLayout {

  sidebarOpen = true;

  userMgmtOpen = false;


  constructor(

    private authService: AuthService,

    public loader: LoaderService,

    private router: Router

  ) {

    this.handleRouteLoader();

  }


  // ============================================================
  // ROUTE LOADER
  // ============================================================

  handleRouteLoader() {

    this.router.events.subscribe(
      event => {

        if (
          event instanceof NavigationStart
        ) {

          this.loader.show();

        }


        if (

          event instanceof NavigationEnd ||

          event instanceof NavigationCancel ||

          event instanceof NavigationError

        ) {

          this.loader.hide();

        }

      }
    );

  }


  // ============================================================
  // TOGGLE SIDEBAR
  // ============================================================

  toggleSidebar() {

    this.sidebarOpen =
      !this.sidebarOpen;


    // Close submenu when sidebar collapses

    if (!this.sidebarOpen) {

      this.userMgmtOpen = false;

    }

  }


  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  toggleUserMgmt() {

    if (!this.sidebarOpen) {

      return;

    }


    this.userMgmtOpen =
      !this.userMgmtOpen;

  }


  // ============================================================
  // LOGOUT
  // ============================================================

  logout() {

    this.authService.logout();

  }

}