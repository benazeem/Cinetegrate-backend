import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function sanitizeResponseData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeResponseData(item));
  }

  if (data instanceof Date) {
    return data;
  }

  if (typeof data === 'object') {
    if (typeof data.toHexString === 'function') {
      return data.toString();
    }

    const plainObj = typeof data.toJSON === 'function' ? data.toJSON() : data;

    if (typeof plainObj !== 'object' || plainObj === null || plainObj instanceof Date) {
      return plainObj;
    }

    const sanitizedObj: any = {};

    for (const [key, value] of Object.entries(plainObj)) {
      if (key === '_id') {
        continue;
      }
      if (key === '__v') {
        continue;
      }
      sanitizedObj[key] = sanitizeResponseData(value);
    }

    if ('_id' in plainObj && !('id' in plainObj)) {
      sanitizedObj.id = sanitizeResponseData(plainObj._id);
    }

    return sanitizedObj;
  }

  return data;
}

export function sendSuccess<T>(res: Response, data: T, message = 'Success', status = 200): Response {
  const sanitizedData = sanitizeResponseData(data);
  const body: ApiResponse<T> = { message, data: sanitizedData as T };
  return res.status(status).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginatedApiResponse<T>['pagination'],
  message = 'Success',
  status = 200
): Response {
  const sanitizedData = sanitizeResponseData(data);
  const body: PaginatedApiResponse<T> = { message, data: sanitizedData as T[], pagination };
  return res.status(status).json(body);
}
