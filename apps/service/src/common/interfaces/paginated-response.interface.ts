export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current: number;
  pageSize: number;
} 