import { AppError } from "../../shared/errors/AppError.ts";
import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import type { AuthUserRow, UserMetricsResponse, UserRow } from "../../shared/types/user.ts";
import { resolveRole } from "../../shared/utils/roleUtils.ts";
import type { CreateUserRequest, ListUsersQuery } from "../DTOs/users/UserRequests.dto.ts";
import type { AssignAnalyst, UserSummary } from "../DTOs/users/UserResponse.dto.ts";
import type { RequestCategory } from "../../shared/types/requests.ts";

interface UserSummaryRow {
  user_id: number;
  full_name: string;
  email: string;
  profile_name: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: Date;
}

export async function findProfileIdByName(name: string): Promise<number | null> {
  const row = await db("profiles").where({ name }).first("profile_id");

  return row?.profile_id ?? null;
}

export async function findUserById(id: number): Promise<AuthUserRow | undefined> {
  return db("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("u.user_id", id)
    .first(
      "u.user_id",
      "u.full_name",
      "u.email",
      "u.password_hash",
      "u.profile_id",
      "u.is_active",
      "u.must_change_password",
      "u.password_changed_at",
      "u.created_at",
      "u.updated_at",
      "p.name as profile_name",
      "p.is_active as profile_is_active",
    );
}

/** Perfis que ganham a extensão de profissional (1:1 user → details_professional)
 *  logo na criação de conta. Elegibilidade de *atribuição* continua restrita a
 *  `analista` (ver ASSIGNABLE_PROFILES em requests.repository). */
export const PROFESSIONAL_PROFILES = ["analista", "gestor"] as const;

/** True quando o perfil informado deve nascer com a extensão details_professional. */
export function isProfessionalProfile(profileName: string): boolean {
  return (PROFESSIONAL_PROFILES as readonly string[]).includes(profileName.trim().toLowerCase());
}

/**
 * Cria a extensão de profissional dentro da transação fornecida (atômica com a
 * criação do usuário). `professional_id` nasce do default da coluna
 * (gen_random_uuid()); `status` e `capacity` dos defaults do schema. Os campos
 * de card (job_title, specialties, attended_category_ids, notes) nascem nulos.
 */
export async function createProfessionalData(trx: Knex.Transaction, userId: number): Promise<void> {
  await trx("details_professional").insert({
    user_id: userId,
    status: "active",
    capacity: 5,
  });
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
      profile_name: "p.name",
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
      profile: resolveRole(row.profile_name),
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

interface AnalystRow {
  user_id: number;
  full_name: string;
  email: string;
  job_title: string | null;
  attended_category_ids: string | null;
  notes: string | null;
  professional_id: string;
}

export async function listAnalysts(): Promise<AssignAnalyst[]> {
  const rows = (await db("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .join("details_professional as dp", "dp.user_id", "u.user_id")
    .where("p.name", "analista")
    .andWhere("p.is_active", true)
    .andWhere("u.is_active", true)
    .andWhere("dp.status", "active")
    .select({
      user_id: "u.user_id",
      full_name: "u.full_name",
      email: "u.email",
      job_title: "dp.job_title",
      attended_category_ids: "dp.attended_category_ids",
      notes: "dp.notes",
      professional_id: "dp.professional_id",
    })
    .orderBy("u.full_name", "asc")) as AnalystRow[];

  if (rows.length === 0) return [];

  const categoryMap = new Map<number, string>();
  const categories = (await db("categories")
    .where({ status: "active" })
    .select("category_id", "name")) as Array<{ category_id: number; name: string }>;
  for (const cat of categories) {
    categoryMap.set(cat.category_id, cat.name);
  }

  // > pendencia: requestLoad hoje é COUNT(*) ao vivo (requests.professional_id).
  // Deve virar coluna materializada (users.request_load ou details_professional.request_load)
  // mantida por trigger soma/subtrai em INSERT/UPDATE/DELETE de requests.
  const professionalIds = rows.map((r) => r.professional_id);
  const counts = (await db("requests")
    .whereIn("professional_id", professionalIds)
    .select("professional_id")
    .count<{ professional_id: string; count: string }>("* as count")
    .groupBy("professional_id")) as Array<{ professional_id: string; count: string }>;
  const countByProfessional = new Map<string, number>();
  for (const c of counts) {
    countByProfessional.set(c.professional_id, Number(c.count));
  }

  return rows.map((row) => {
    const categoriesForAnalyst: RequestCategory[] = [];
    if (row.attended_category_ids) {
      for (const part of row.attended_category_ids.split(",")) {
        const id = Number(part.trim());
        if (!Number.isNaN(id)) {
          const name = categoryMap.get(id);
          if (name) categoriesForAnalyst.push(name as RequestCategory);
        }
      }
    }

    return {
      id: String(row.user_id),
      fullName: row.full_name,
      email: row.email,
      specialty: row.job_title ?? "",
      categories: categoriesForAnalyst,
      notes: row.notes ?? null,
      requestLoad: countByProfessional.get(row.professional_id) ?? 0,
    } satisfies AssignAnalyst;
  });
}

/** Métricas consolidadas da base de usuários — leitura simples, sem transação. */
export const fetchUserMetrics = async (): Promise<UserMetricsResponse> => {
  const result = await db("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .select(
      db.raw('COUNT(u.*)::int as "total"'),
      db.raw('COUNT(CASE WHEN u.is_active THEN 1 END)::int as "active"'),
      db.raw('COUNT(CASE WHEN u.must_change_password THEN 1 END)::int as "pending"'),
      db.raw("COUNT(CASE WHEN p.name = 'administrador' THEN 1 END)::int as \"admins\""),
    )
    .first();

  return {
    total: result?.total ?? 0,
    active: result?.active ?? 0,
    pending: result?.pending ?? 0,
    admins: result?.admins ?? 0,
  };
};
