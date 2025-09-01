import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiResponse } from '../api.response';

export class ForbiddenResponse extends ApiResponse<null> {
  constructor(error = 'Access Denied') {
    super(HttpStatus.FORBIDDEN, null, null, error);
  }
}
