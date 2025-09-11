import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiResponse } from '../api.response';

export class UnAuthorizedResponse extends ApiResponse<null> {
  constructor(error = 'Unauthorized') {
    super(HttpStatus.UNAUTHORIZED, null, null, error);
  }
}
