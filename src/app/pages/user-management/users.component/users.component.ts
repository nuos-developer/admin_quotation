import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';
import { LoaderService } from '../../../core/services/loader.service';
import { ToastService } from '../../../core/services/toast.service';

interface PermissionFlags {
  can_create: boolean;
  can_view: boolean;
  can_update: boolean;
  can_delete: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  roles: any[] = [];
  modules: any[] = [];

  searchText: string = '';

  selectedUser: any = null;
  selectedRoleId: number | null = null;

  showView = false;
  showPermission = false;

  permissionsMap: Record<number, PermissionFlags> = {};
  hasPermissionSelected = false;

  constructor(
    private admin: AdminService,
    private loader: LoaderService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  /* ================= LOAD USERS ================= */
  loadUsers(): void {
    this.loader.show();

    this.admin.getUsers().subscribe({
      next: (res: any) => {
        this.users = res.data || [];
        this.filteredUsers = [...this.users];
        this.loader.hide();
      },
      error: () => {
        this.toast.show('Failed to load users', 'error');
        this.loader.hide();
      }
    });
  }

  /* ================= VIEW ================= */
  viewUser(user: any): void {
    this.selectedUser = { ...user };
    this.showView = true;
  }

  /* ================= OPEN PERMISSION ================= */
  openPermission(user: any): void {
    this.selectedUser = user;
    this.showPermission = true;

    this.permissionsMap = {};
    this.selectedRoleId = null;
    this.hasPermissionSelected = false;

    this.loader.show();

    // ✅ PARALLEL API CALL (BEST PRACTICE)
    forkJoin({
      roles: this.admin.getRoles(),
      modules: this.admin.getModules()
    }).subscribe({
      next: (res: any) => {
        this.roles = res.roles.data || [];
        this.modules = res.modules.data || [];

        // initialize map
        this.modules.forEach((m: any) => {
          this.permissionsMap[m.id] = {
            can_create: false,
            can_view: false,
            can_update: false,
            can_delete: false
          };
        });

        this.loadUserPermissions(user.id);
      },
      error: () => {
        this.toast.show('Failed to load roles/modules', 'error');
        this.loader.hide();
      }
    });
  }

  /* ================= LOAD USER PERMISSIONS ================= */
  loadUserPermissions(userId: number): void {
    this.admin.getUserPermissions(userId).subscribe({
      next: (res: any) => {
        const perms = res.data || [];

        if (perms.length) {
          this.selectedRoleId = Number(perms[0].role_id);

          perms.forEach((p: any) => {
            if (!this.permissionsMap[p.module_id]) return;

            this.permissionsMap[p.module_id] = {
              can_create: p.can_create,
              can_view: p.can_view,
              can_update: p.can_update,
              can_delete: p.can_delete
            };
          });
        }

        this.onPermissionChange();
        this.loader.hide();
      },
      error: () => {
        this.toast.show('Failed to load permissions', 'error');
        this.loader.hide();
      }
    });
  }

  /* ================= PERMISSION CHECK ================= */
  onPermissionChange(): void {
    this.hasPermissionSelected = Object.values(this.permissionsMap).some(
      p => p.can_create || p.can_view || p.can_update || p.can_delete
    );
  }

  /* ================= SAVE ================= */
  saveAllPermissions(): void {
    if (!this.selectedRoleId) {
      this.toast.show('Please select role', 'error');
      return;
    }

    this.loader.show();

    const permissionsPayload = this.modules
      .filter(m => {
        const p = this.permissionsMap[m.id];
        return p && (p.can_create || p.can_view || p.can_update || p.can_delete);
      })
      .map(m => ({
        module_id: m.id,
        ...this.permissionsMap[m.id]
      }));

    const payload = {
      user_id: this.selectedUser.id,
      role_id: this.selectedRoleId,
      is_admin_approve: 'APPROVED',
      permissions: permissionsPayload
    };

    this.admin.assignPermission(payload).subscribe({
      next: () => {
        this.toast.show('Permissions saved successfully', 'success');
        this.loader.hide();
        this.close();
      },
      error: () => {
        this.toast.show('Failed to save permissions', 'error');
        this.loader.hide();
      }
    });
  }

  /* ================= SEARCH ================= */
  filterUsers(): void {
    const search = this.searchText.toLowerCase();

    this.filteredUsers = this.users.filter(u =>
      (u.user_name || '').toLowerCase().includes(search) ||
      (u.email_id || '').toLowerCase().includes(search) ||
      (u.mobile_number || '').includes(search)
    );
  }

  /* ================= CLOSE ================= */
  close(): void {
    this.showView = false;
    this.showPermission = false;
    this.selectedUser = null;
  }
}