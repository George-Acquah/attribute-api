import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiResponse } from '../api.response';

export class BadRequestResponse extends ApiResponse<null> {
  constructor(error = 'Bad Request') {
    super(HttpStatus.BAD_REQUEST, null, null, error);
  }
}
