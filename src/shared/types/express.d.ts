import type { AuthenticatedUser } from "./user.ts";
import type { TokenScope } from "../utils/jwtUtil.ts";
import type { PortalSolicitationMode } from "./systemSettings.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      authScope?: TokenScope;
      /** Modo de abertura do portal vigente na request (preenchido pelo guard). */
      accessMode?: PortalSolicitationMode;
    }
  }
}
