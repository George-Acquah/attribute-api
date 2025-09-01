import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiResponse } from '../api.response';

export class InternalServerErrorResponse extends ApiResponse<null> {
  constructor(error = 'Internal Server Error') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, null, null, error);
  }
}
