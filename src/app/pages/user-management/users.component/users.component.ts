import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

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

  selectedUser: any;
  selectedRoleId: number | null = null;

  showView = false;
  showPermission = false;

  permissionsMap: Record<number, PermissionFlags> = {};
  hasPermissionSelected = false;

  constructor(
    private admin: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.admin.getUsers().subscribe((res: any) => {
      this.users = res.data;
    });
  }

  /* VIEW USER */
  viewUser(user: any): void {
    this.selectedUser = { ...user };
    this.showView = true;
  }

  /* OPEN PERMISSION MODAL */
  openPermission(user: any): void {
    this.selectedUser = user;
    this.showPermission = true;

    this.permissionsMap = {};
    this.selectedRoleId = null;
    this.hasPermissionSelected = false;

    this.admin.getRoles().subscribe(roleRes => {
      this.roles = roleRes.data;

      this.admin.getModules().subscribe(modRes => {
        this.modules = modRes.data;

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

  loadUserPermissions(userId: number): void {
    this.admin.getUserPermissions(userId).subscribe(res => {
      const perms = res.data || [];
      if (!perms.length) return;

      this.selectedRoleId = Number(perms[0].role_id);

      perms.forEach(p => {
        this.permissionsMap[p.module_id] = {
          can_create: p.can_create,
          can_view: p.can_view,
          can_update: p.can_update,
          can_delete: p.can_delete
        };
      });

      this.onPermissionChange();
      this.cdr.detectChanges();
    });
  }

  onPermissionChange(): void {
    this.hasPermissionSelected = Object.values(this.permissionsMap).some(p =>
      p.can_create || p.can_view || p.can_update || p.can_delete
    );
  }

  saveAllPermissions(): void {
    if (!this.selectedRoleId) {
      alert('Please select role');
      return;
    }

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

    this.admin.assignPermission(payload).subscribe(() => {
      alert('Permissions saved successfully');
      this.close();
    });
  }

  close(): void {
    this.showView = false;
    this.showPermission = false;
    this.selectedUser = null;
  }
}
