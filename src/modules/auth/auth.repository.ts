import { AppError } from "../../shared/errors/AppError.ts";
import type { UserRow } from "../../shared/types/user.ts";
import db from "../../database/conection.ts";

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return db("users").where({ email }).first();
}

export async function findUserById(id: number): Promise<UserRow | undefined> {
  return db("users").where({ user_id: id }).first();
}

export interface AuthState {
  is_active: boolean;
  must_change_password: boolean;
}

/** Estado de autenticação em tempo real — usado pelo middleware a cada request. */
export async function getAuthState(id: number): Promise<AuthState | undefined> {
  return db("users").where({ user_id: id }).first("is_active", "must_change_password");
}

export async function changePassword(id: number, newPasswordHash: string): Promise<void> {
  const updated = await db("users").where({ user_id: id }).update({
    password_hash: newPasswordHash,
    must_change_password: false,
    updated_at: db.fn.now(),
  });

  if (updated === 0) {
    throw new AppError("Usuário não encontrado", 404);
  }
}
