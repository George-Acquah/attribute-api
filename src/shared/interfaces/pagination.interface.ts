export interface _IPaginationParams {
  limit?: number;
  page?: number;
  query?: string;
}

export interface _IPaginationWithDatesParams extends _IPaginationParams {
  startDate?: Date;
  endDate?: Date;
}
