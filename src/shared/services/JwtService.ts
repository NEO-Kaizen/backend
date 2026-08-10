import { sign, verify, type JwtPayload, type SignOptions } from "jsonwebtoken";
import { AppError } from "../errors/AppError.ts";

export interface TokenPayload {
  id: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"];

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  return sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  const decoded = verify(token, secret) as JwtPayload;

  if (typeof decoded.id !== "string" || typeof decoded.email !== "string") {
    throw new AppError("Invalid Token", 401);
  }

  return { id: decoded.id, email: decoded.email };
}
