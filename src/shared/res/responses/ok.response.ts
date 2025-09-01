import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { ApiResponse } from '../api.response';

export class OkResponse<T> extends ApiResponse<T> {
  constructor(data: T, message = 'OK') {
    super(HttpStatus.OK, data, message, null);
  }
}
