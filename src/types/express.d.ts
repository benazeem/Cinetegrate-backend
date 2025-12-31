import { type User } from "@models/User.ts"; // whatever your user type is
import type { Pagination, Sorting } from "@middleware/paginationAndSorting.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
      pagination?: Pagination;
      sorting?: Sorting;
      validatedBody?: unknown;
    }
  }
}
