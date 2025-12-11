import { type User } from "@models/User.ts"; // whatever your user type is

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}
