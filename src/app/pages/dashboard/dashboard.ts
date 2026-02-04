import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard  implements OnInit {

  loading = true;
  summary: any = {};
  roleWiseUsers: any[] = [];

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.fetchDashboard();
  }

  fetchDashboard() {
    this.loading = true;

    this.admin.dashboard().subscribe({
      next: (res: any) => {
        // ✅ correct mapping
        this.summary = res.data.summary;
        this.roleWiseUsers = res.data.roleWiseUsers;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}