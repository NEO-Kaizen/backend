import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { AppError } from "../errors/AppError.ts";
import { isRole, type Role } from "../types/role.ts";
import Config from "../../configs.ts";

const { sign, verify } = jwt;

export type TokenScope = "session" | "change_password";

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Época (ms) de `users.password_changed_at` no momento da emissão — usado
   *  para revogar tokens emitidos antes de uma troca/redefinição de senha. */
  password_changed_at: number;
  scope?: TokenScope;
}

export function generateToken(payload: TokenPayload): string {
  const secret = Config.JWT_SECRET;
  const expiresIn = Config.JWT_EXPIRES_IN as SignOptions["expiresIn"];

  if (!secret) {
    throw new Error("Variável de ambiente JWT_SECRET não está definida");
  }

  return sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  const secret = Config.JWT_SECRET;

  if (!secret) {
    throw new Error("Variável de ambiente JWT_SECRET não está definida");
  }

  const decoded = verify(token, secret) as unknown as TokenPayload;

  if (
    typeof decoded.id !== "string" ||
    typeof decoded.name !== "string" ||
    typeof decoded.email !== "string" ||
    typeof decoded.role !== "string" ||
    typeof decoded.password_changed_at !== "number" ||
    Number.isNaN(decoded.password_changed_at) ||
    !isRole(decoded.role)
  ) {
    throw new AppError("Token inválido", 401);
  }

  const scope = decoded.scope === "change_password" ? "change_password" : "session";

  return {
    id: decoded.id,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
    password_changed_at: decoded.password_changed_at,
    scope,
  };
}
