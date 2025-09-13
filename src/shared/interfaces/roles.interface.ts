export interface _ICreateRole {
  name: string;
  description?: string;
}
export interface _IRole extends _ICreateRole {
  id: string;
  // createdAt: Date;
  // updatedAt: Date;
}

export interface _IRoleWithPermissions extends _IRole {
  permissions: _IPermission[];
}

export interface _IPermission {
  id: string;
  action: string;
  subject: string;
  conditions?: any;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface _IPermissionWithRole extends _IPermission {
  role: _IRole;
}
