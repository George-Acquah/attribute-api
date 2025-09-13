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

  @IsString()
  roleId: string;
}
