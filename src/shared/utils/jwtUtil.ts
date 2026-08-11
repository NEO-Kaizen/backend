import { sign, verify, type SignOptions } from "jsonwebtoken";
import { AppError } from "../errors/AppError.ts";
import { isRole, type Role } from "../types/role.ts";

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"];

  if (!secret) {
    throw new Error("Variável de ambiente JWT_SECRET não está definida");
  }

  return sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Variável de ambiente JWT_SECRET não está definida");
  }

  const decoded = verify(token, secret) as TokenPayload;

  if (
    typeof decoded.id !== "string" ||
    typeof decoded.name !== "string" ||
    typeof decoded.email !== "string" ||
    typeof decoded.role !== "string" ||
    !isRole(decoded.role)
  ) {
    throw new AppError("Token inválido", 401);
  }

  return { id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role };
}
