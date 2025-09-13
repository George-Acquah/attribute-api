import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  action: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, Record<string, any>>;

  @IsString()
  roleId: string;
}
