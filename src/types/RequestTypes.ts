import { User } from "@models/User.js";
import { Request } from "express";
import { Pagination, Sorting } from "./Pagination.js";

export interface AuthenticatedRequest extends Request {
  user: User;
  sessionId: string;
}

export interface ValidatedRequest<T> extends Request {
  validatedBody: T;
}

export interface ValidatedParamsRequest<T> extends Request {
  validatedParams: T;
}

export interface PaginatedRequest extends Request {
 pagination: Pagination;
 sorting: Sorting;
} 