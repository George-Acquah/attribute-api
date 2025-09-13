import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiResponse } from '../api.response';

export class ConflictResponse extends ApiResponse<null> {
  constructor(error = 'Conflict') {
    super(HttpStatus.CONFLICT, null, null, error);
  }
}
