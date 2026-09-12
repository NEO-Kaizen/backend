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
  password_changed_at: Date;
}

/** Estado de autenticação em tempo real — usado pelo middleware a cada request. */
export async function getAuthState(id: number): Promise<AuthState | undefined> {
  return db("users")
    .where({ user_id: id })
    .first("is_active", "must_change_password", "password_changed_at");
}

export async function changePassword(
  id: number,
  newPasswordHash: string,
): Promise<{ password_changed_at: Date }> {
  const updated = await db("users")
    .where({ user_id: id })
    .update({
      password_hash: newPasswordHash,
      must_change_password: false,
      password_changed_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning("password_changed_at");

  const passwordChangedAt = updated[0]?.password_changed_at;

  if (typeof passwordChangedAt === "undefined") {
    throw new AppError("Usuário não encontrado", 404);
  }

  return { password_changed_at: passwordChangedAt };
}
