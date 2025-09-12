export class PermissionDto {
  id: string;
  action: string;
  subject: string;
  conditions?: any;
  roleId?: string;
  role?: { id: string; name: string };
}
