import { type User } from "@models/User.ts"; // whatever your user type is
import type { Pagination, Sorting } from "@middleware/paginationAndSorting.js";
import { type AccountStatus, Role } from "constants/userConts.ts";

type AuthenticatedUser = {
  id: string;
  role: Role; 
  accountStatus?: AccountStatus;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string; 
      pagination?: Pagination;
      sorting?: Sorting;
      validatedBody?: unknown;
      validatedParams?: unknown;
      accountStatus?: string; 
    }
  }
}
