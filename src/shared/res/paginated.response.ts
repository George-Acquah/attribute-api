import { _IPaginationMeta } from '../interfaces/responses.interface';
import { ApiResponse } from './api.response';

class PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  meta: _IPaginationMeta;
}> {
  constructor(
    statusCode: number,
    items: T[],
    meta: _IPaginationMeta,
    message?: string,
    error?: string,
  ) {
    super(statusCode, { items, meta }, message, error);
  }
}

export { PaginatedResponse };
