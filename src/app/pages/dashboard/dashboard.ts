import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  summary: any = {};
  roleWiseUsers: any[] = [];
  isLoading: boolean = false;

  constructor(
    private admin: AdminService,
    private loader: LoaderService
  ) {}

  ngOnInit(): void {
    this.fetchDashboard();
  }

fetchDashboard() {
  this.isLoading = true;     // ✅ local loader
  this.loader.show();        // global loader (optional)

  this.admin.dashboard().subscribe({
    next: (res: any) => {
      this.summary = res.data.summary;
      this.roleWiseUsers = res.data.roleWiseUsers;

      this.isLoading = false;
      this.loader.hide();
    },
    error: () => {
      this.isLoading = false;
      this.loader.hide();
    }
  });
}
}