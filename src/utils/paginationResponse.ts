import type { Pagination } from '@app-types/Pagination.js';

export function paginationResponse(pagination: Pagination, totalItems: number) {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total: totalItems || 0,
    totalPages: Math.ceil(totalItems / pagination.limit),
    hasNext: pagination.page * pagination.limit < totalItems,
    hasPrev: pagination.page > 1,
  };
}
