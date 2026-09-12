import type { AuthenticatedUser } from "./user.ts";
import type { TokenScope } from "../utils/jwtUtil.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      authScope?: TokenScope;
    }
  }
}
