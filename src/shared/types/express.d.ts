import type { AuthenticatedUser } from "./user.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
