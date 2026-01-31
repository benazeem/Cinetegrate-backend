import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "./error/index.js";
import type { Pagination, Sorting } from "types/Pagination.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Whitelist sortable fields (CRITICAL)
const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "title", "status","name", "lastUsedAt"];

export function paginationAndSortingMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // ---------- Pagination ---------- 
  const page = Number(req.query.page) || DEFAULT_PAGE;
  const limit = Number(req.query.limit) || DEFAULT_LIMIT;

  if (page < 1) {
    throw new BadRequestError("Page must be greater than 0");
  }

  if (limit < 1 || limit > MAX_LIMIT) {
    throw new BadRequestError(`Limit must be between 1 and ${MAX_LIMIT}`);
  }

  const pagination: Pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };

  // ---------- Sorting ----------
  const sortBy =
    typeof req.query.sortBy === "string" &&
    ALLOWED_SORT_FIELDS.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";

  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // default desc

  const sorting: Sorting = {
       sortBy,
       sortOrder
  };

  req.pagination = pagination;
  req.sorting = sorting;

  next();
}
