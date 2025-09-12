import { IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  conditions?: any;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  roleName?: string;
}
