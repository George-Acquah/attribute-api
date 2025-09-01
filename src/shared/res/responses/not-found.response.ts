import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiResponse } from '../api.response';

export class NotFoundResponse extends ApiResponse<null> {
  constructor(error = 'Not Found') {
    super(HttpStatus.NOT_FOUND, null, null, error);
  }
}
