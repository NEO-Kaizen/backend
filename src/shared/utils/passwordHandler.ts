import { randomBytes } from "node:crypto";
import { hash, genSalt, compare } from "bcrypt";
import { AppError } from "../errors/AppError.ts";

export async function hashPassword(password: string) {
  try {
    const salt = await genSalt(10);

    const hashedPassword = await hash(password, salt);

    return hashedPassword;
  } catch {
    throw new AppError("Erro ao gerar hash da senha", 500);
  }
}

export async function comparePassword(password: string, hashedPassword: string) {
  try {
    const match = await compare(password, hashedPassword);

    return match;
  } catch {
    throw new AppError("Erro ao comparar as senhas", 500);
  }
}

/**
 * Senha temporária gerada por CSPRNG, exibida uma única vez ao
 * administrador. Satisfaz a política mínima (>= 8 chars).
 */
export function generateTemporaryPassword(length = 14): string {
  return randomBytes(length).toString("base64url");
}
