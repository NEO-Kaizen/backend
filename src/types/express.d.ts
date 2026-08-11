import type { TokenPayload } from "../shared/utils/jwtUtil.ts";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
