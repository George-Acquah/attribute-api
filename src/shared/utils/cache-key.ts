import { _IPaginationParams } from '../interfaces/pagination.interface';

export function buildPaginatedListCacheKey(
  path: string,
  p: _IPaginationParams,
): string {
  return `${path}:list:page=${p.page || 1}:limit=${p.limit || 10}:query=${
    p.query || ''
  }`;
}
