import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { LoaderService } from '../../../core/services/loader.service';

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
  roles: any[] = [];
  modules: any[] = [];
  searchText: string = '';
filteredUsers: any[] = [];

  selectedUser: any;
  selectedRoleId: number | null = null;

  showView = false;
  showPermission = false;

  permissionsMap: Record<number, PermissionFlags> = {};
  hasPermissionSelected = false;

  constructor(
    private admin: AdminService,
    private loader: LoaderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  /* 🔹 LOAD USERS */
  loadUsers(): void {
    this.loader.show();   // 🔥 START LOADER

    this.admin.getUsers().subscribe({
      next: (res: any) => {
  this.users = res.data || [];
this.filteredUsers = [...this.users]; // ✅ important
        this.loader.hide();   // 🔥 STOP
      },
      error: () => {
        this.loader.hide();
      }
    });
  }

  /* VIEW USER */
  viewUser(user: any): void {
    this.selectedUser = { ...user };
    this.showView = true;
  }

  /* 🔹 OPEN PERMISSION MODAL */
  openPermission(user: any): void {
    this.selectedUser = user;
    this.showPermission = true;

    this.permissionsMap = {};
    this.selectedRoleId = null;
    this.hasPermissionSelected = false;

    this.loader.show();   // 🔥 START LOADER

    this.admin.getRoles().subscribe(roleRes => {
      this.roles = roleRes.data || [];

      this.admin.getModules().subscribe(modRes => {
        this.modules = modRes.data || [];

        this.modules.forEach(m => {
          this.permissionsMap[m.id] = {
            can_create: false,
            can_view: false,
            can_update: false,
            can_delete: false
          };
        });

        this.loadUserPermissions(user.id);
      });
    });
  }

  /* 🔹 LOAD USER PERMISSIONS */
  loadUserPermissions(userId: number): void {
    this.admin.getUserPermissions(userId).subscribe({
      next: (res: any) => {
        const perms = res.data || [];

        if (perms.length) {
          this.selectedRoleId = Number(perms[0].role_id);

          perms.forEach((p: any) => {
            this.permissionsMap[p.module_id] = {
              can_create: p.can_create,
              can_view: p.can_view,
              can_update: p.can_update,
              can_delete: p.can_delete
            };
          });
        }

        this.onPermissionChange();
        this.loader.hide();   // 🔥 FINAL STOP
        this.cdr.detectChanges();
      },
      error: () => {
        this.loader.hide();
      }
    });
  }

  onPermissionChange(): void {
    this.hasPermissionSelected = Object.values(this.permissionsMap).some(p =>
      p.can_create || p.can_view || p.can_update || p.can_delete
    );
  }

  /* 🔹 SAVE PERMISSIONS */
  saveAllPermissions(): void {
    if (!this.selectedRoleId) {
      alert('Please select role');
      return;
    }

    this.loader.show();   // 🔥 START

    const permissionsPayload = this.modules
      .filter(m => {
        const p = this.permissionsMap[m.id];
        return p.can_create || p.can_view || p.can_update || p.can_delete;
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
        alert('Permissions saved successfully');
        this.loader.hide();   // 🔥 STOP
        this.close();
      },
      error: () => {
        this.loader.hide();
      }
    });
  }

  close(): void {
    this.showView = false;
    this.showPermission = false;
    this.selectedUser = null;
  }

  filterUsers() {
  const search = this.searchText.toLowerCase();

  this.filteredUsers = this.users.filter(u => {
    return (
      u.user_name?.toLowerCase().includes(search) ||
      u.email_id?.toLowerCase().includes(search) ||
      u.mobile_number?.includes(search)
    );
  });
}

}