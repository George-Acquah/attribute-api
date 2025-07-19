import { _IPaginationMeta } from '../interfaces/responses.interface';
import { ApiResponse } from './api.response';

class PaginatedResponse<T> extends ApiResponse<T[]> {
  constructor(
    statusCode: number,
    message: string,
    data: T[],
    public meta: _IPaginationMeta,
  ) {
    super(statusCode, message, data);
  }
}

export { PaginatedResponse };
