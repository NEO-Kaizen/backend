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
      /** Identidade pública verificada via header `X-Requester-Identity` (pendências). */
      requesterIdentity?: { name: string; email: string } | null;
      /** Protocolo verificado junto da identidade pública (anti-IDOR). */
      requesterVerifiedProtocol?: string | null;
    }
  }
}
