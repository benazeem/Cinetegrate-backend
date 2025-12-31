export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export interface Sorting {
  sortBy: string;
  sortOrder: 1 | -1;
}
