import { SetMetadata } from '@nestjs/common/decorators/core/set-metadata.decorator';
import { AppSubjects } from '../interfaces/casl.interfac';
import { Action } from '../enums/casl.enums';

export const PERMISSION_KEY = 'permission';

export interface PermissionMetadata {
  action: Action;
  subject: AppSubjects;
}

export const RequirePermission = (action: Action, subject: AppSubjects) =>
  SetMetadata(PERMISSION_KEY, { action, subject } as PermissionMetadata);
