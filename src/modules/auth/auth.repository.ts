import { AppError } from "../../shared/errors/AppError.ts";
import type { Knex } from "knex";
import type { AuthUserRow } from "../../shared/types/user.ts";
import db from "../../database/conection.ts";

function authUserQuery() {
  return db("users as u").join("profiles as p", "p.profile_id", "u.profile_id");
}

export async function findUserByEmail(email: string): Promise<AuthUserRow | undefined> {
  return authUserQuery()
    .where("u.email", email)
    .first(
      "u.user_id",
      "u.full_name",
      "u.email",
      "u.avatar_url",
      "u.password_hash",
      "u.profile_id",
      "u.is_active",
      "u.must_change_password",
      "u.password_changed_at",
      "u.created_at",
      "u.updated_at",
      "p.name as profile_name",
      "p.is_active as profile_is_active",
      "p.is_root as profile_is_root",
    );
}

export async function findUserById(id: number): Promise<AuthUserRow | undefined> {
  return authUserQuery()
    .where("u.user_id", id)
    .first(
      "u.user_id",
      "u.full_name",
      "u.email",
      "u.avatar_url",
      "u.password_hash",
      "u.profile_id",
      "u.is_active",
      "u.must_change_password",
      "u.password_changed_at",
      "u.created_at",
      "u.updated_at",
      "p.name as profile_name",
      "p.is_active as profile_is_active",
      "p.is_root as profile_is_root",
    );
}

export interface AuthState {
  is_active: boolean;
  profile_id: number;
  profile_is_active: boolean;
  profile_name: string;
  must_change_password: boolean;
  password_changed_at: Date;
}

/** Estado de autenticação em tempo real — usado pelo middleware a cada request. */
export async function getAuthState(id: number): Promise<AuthState | undefined> {
  return authUserQuery()
    .where("u.user_id", id)
    .first(
      "u.is_active",
      "u.must_change_password",
      "u.password_changed_at",
      "u.profile_id",
      "p.is_active as profile_is_active",
      "p.name as profile_name",
    );
}

/** Concessão persistida do Perfil — a lista efetiva é montada pelo catálogo. */
export interface UserPermissionRow {
  permission_key: string;
  custody: string;
}

/**
 * Concessões do Perfil vigente do usuário. Lida a cada requisição que devolve a
 * sessão e pelo gate de chave — o Perfil vem do banco, nunca do token.
 */
export async function listUserPermissions(userId: number): Promise<UserPermissionRow[]> {
  return db("users as u")
    .join("profile_permissions as pp", "pp.profile_id", "u.profile_id")
    .where("u.user_id", userId)
    .select("pp.permission_key", "pp.custody");
}

/** Altera a senha dentro da transação fornecida (atômico com a auditoria). */
export async function changePassword(
  trx: Knex.Transaction,
  id: number,
  newPasswordHash: string,
): Promise<{ password_changed_at: Date }> {
  const updated = await trx("users")
    .where({ user_id: id })
    .update({
      password_hash: newPasswordHash,
      must_change_password: false,
      password_changed_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    })
    .returning("password_changed_at");

  const passwordChangedAt = updated[0]?.password_changed_at;

  if (typeof passwordChangedAt === "undefined") {
    throw new AppError("Usuário não encontrado", 404);
  }

  return { password_changed_at: passwordChangedAt };
}
