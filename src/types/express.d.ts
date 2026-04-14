import { type User } from '@models/User.js';
import type { Pagination, Sorting } from '@middleware/request/paginationAndSorting.js';
import { type AccountStatus, Role } from '@constants/userConsts.js';

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
