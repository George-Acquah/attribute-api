import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiResponse } from '../api.response';

export class CreatedResponse<T> extends ApiResponse<T> {
  constructor(data: T, message = 'Created') {
    super(HttpStatus.CREATED, data, message, null);
  }
}
