export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}


interface PermissionFlags {
  can_create: boolean;
  can_view: boolean;
  can_update: boolean;
  can_delete: boolean;
}