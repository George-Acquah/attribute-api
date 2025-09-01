export interface _IPaginationParams {
  limit?: number;
  page?: number;
  query?: string;
}

export interface _IDatesParams {
  startDate?: Date;
  endDate?: Date;
}

export interface _IPaginationWithDatesParams
  extends _IPaginationParams,
    _IDatesParams {}
