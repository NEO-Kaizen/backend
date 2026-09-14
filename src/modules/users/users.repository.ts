import { AppError } from "../../shared/errors/AppError.ts";
import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import type { UserRow } from "../../shared/types/user.ts";
import { profileRole } from "../../shared/utils/roleUtils.ts";
import type { CreateUserRequest, ListUsersQuery } from "../DTOs/users/UserRequests.dto.ts";
import type { UserSummary } from "../DTOs/users/UserResponse.dto.ts";

interface UserSummaryRow {
  user_id: number;
  full_name: string;
  email: string;
  profile_id: number;
  is_active: boolean;
  must_change_password: boolean;
  created_at: Date;
}

export async function findProfileIdByName(name: string): Promise<number | null> {
  const row = await db("profiles").where({ name }).first("profile_id");

  return row?.profile_id ?? null;
}

export async function findUserById(id: number): Promise<UserRow | undefined> {
  return db("users").where({ user_id: id }).first();
}

/** Insere o usuário dentro da transação fornecida (atômico com a auditoria). */
export async function createUser(
  trx: Knex.Transaction,
  payload: Pick<CreateUserRequest, "fullName" | "email">,
  passwordHash: string,
  profileId: number,
): Promise<UserRow> {
  const inserted = (await trx("users")
    .insert({
      full_name: payload.fullName,
      email: payload.email,
      password_hash: passwordHash,
      profile_id: profileId,
      must_change_password: true,
    })
    .returning("*")) as UserRow[];

  const row = inserted[0];
  if (!row) {
    throw new Error("Falha ao salvar o usuário.");
  }

  return row;
}

function baseQuery(query: ListUsersQuery) {
  return db("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where((builder) => {
      if (query.profile) {
        builder.where("p.name", query.profile);
      }
      if (query.search) {
        const escapedSearch = query.search.replace(/[\\%_]/g, "\\$&");
        builder.where((inner) => {
          inner
            .whereILike("u.full_name", `%${escapedSearch}%`, "\\")
            .orWhereILike("u.email", `%${escapedSearch}%`, "\\");
        });
      }
    });
}

export async function listUsers(query: ListUsersQuery): Promise<PaginatedResponse<UserSummary>> {
  const countRows = (await baseQuery(query).count<{ count: string }[]>({
    count: "*",
  })) as { count: string }[];
  const total = Number(countRows[0]?.count ?? 0);

  const rows = (await baseQuery(query)
    .select({
      user_id: "u.user_id",
      full_name: "u.full_name",
      email: "u.email",
      profile_id: "u.profile_id",
      is_active: "u.is_active",
      must_change_password: "u.must_change_password",
      created_at: "u.created_at",
    })
    .orderBy("u.created_at", "desc")
    .orderBy("u.user_id", "desc")
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize)) as UserSummaryRow[];

  return {
    data: rows.map((row) => ({
      id: String(row.user_id),
      fullName: row.full_name,
      email: row.email,
      profile: profileRole(row.profile_id),
      isActive: row.is_active,
      mustChangePassword: row.must_change_password,
      createdAt: row.created_at.toISOString(),
    })),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
  };
}

/** Atualiza o status dentro da transação fornecida (atômico com a auditoria). */
export async function updateStatus(
  trx: Knex.Transaction,
  id: number,
  isActive: boolean,
): Promise<void> {
  const updated = await trx("users")
    .where({ user_id: id })
    .update({ is_active: isActive, updated_at: trx.fn.now() });

  if (updated === 0) {
    throw new AppError("Usuário não encontrado", 404);
  }
}

/** Define senha temporária dentro da transação fornecida (atômico com a auditoria). */
export async function setTemporaryPassword(
  trx: Knex.Transaction,
  id: number,
  passwordHash: string,
): Promise<void> {
  const updated = await trx("users").where({ user_id: id }).update({
    password_hash: passwordHash,
    must_change_password: true,
    password_changed_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });

  if (updated === 0) {
    throw new AppError("Usuário não encontrado", 404);
  }
}
