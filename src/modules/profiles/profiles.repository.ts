import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import type {
  ProfilePermissionRow,
  ProfileRow,
  ProfileWithUserCountRow,
} from "../../shared/types/profile.ts";
import type { AssignabilityStage } from "./profiles.composition.ts";

/**
 * Acesso ao banco dos Perfis. Converte linhas cruas em tipos claros e concentra
 * as consultas; a regra de negócio fica no service e nas guardas puras.
 */

const PROFILE_COLUMNS = [
  "profile_id",
  "name",
  "description",
  "is_active",
  "is_root",
  "is_assignable_triage",
  "is_assignable_mapping",
  "created_at",
  "updated_at",
] as const;

interface ProfileWithCountRow extends Omit<ProfileWithUserCountRow, "user_count"> {
  user_count: string;
}

function withCount(rows: ProfileWithCountRow[]): ProfileWithUserCountRow[] {
  return rows.map((row) => ({ ...row, user_count: Number(row.user_count) }));
}

/** Todos os Perfis, com a contagem de contas vinculadas — ativos e inativos. */
export async function listProfiles(): Promise<ProfileWithUserCountRow[]> {
  const rows = (await db("profiles as p")
    .leftJoin("users as u", "u.profile_id", "p.profile_id")
    .groupBy("p.profile_id")
    .select(PROFILE_COLUMNS.map((column) => `p.${column}`))
    .count({ user_count: "u.user_id" })
    .orderBy("p.profile_id", "asc")) as ProfileWithCountRow[];

  return withCount(rows);
}

export async function findProfileById(id: number): Promise<ProfileWithUserCountRow | undefined> {
  const rows = (await db("profiles as p")
    .leftJoin("users as u", "u.profile_id", "p.profile_id")
    .where("p.profile_id", id)
    .groupBy("p.profile_id")
    .select(PROFILE_COLUMNS.map((column) => `p.${column}`))
    .count({ user_count: "u.user_id" })) as ProfileWithCountRow[];

  return withCount(rows)[0];
}

/** Concessões de todos os Perfis pedidos — uma consulta, sem N+1. */
export async function listPermissionsByProfileIds(
  profileIds: readonly number[],
): Promise<ProfilePermissionRow[]> {
  if (profileIds.length === 0) {
    return [];
  }

  return db("profile_permissions")
    .whereIn("profile_id", profileIds)
    .select("profile_id", "permission_key", "custody");
}

/** Perfil ativo cujo nome coincide sem considerar caixa (unicidade do contrato). */
export async function findActiveProfileByName(
  name: string,
  excludeProfileId?: number,
): Promise<ProfileRow | undefined> {
  const query = db("profiles").where("is_active", true).whereRaw("lower(name) = lower(?)", [name]);

  if (excludeProfileId !== undefined) {
    query.whereNot("profile_id", excludeProfileId);
  }

  return query.first(PROFILE_COLUMNS.map((column) => `profiles.${column}`));
}

/** O perfil vigente do ator é o Admin Root? A marca vem do banco, nunca do nome/token. */
export async function actorIsRoot(actorUserId: number): Promise<boolean> {
  const row = await db("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("u.user_id", actorUserId)
    .first("p.is_root");

  return row?.is_root === true;
}

/** Insere o Perfil dentro da transação fornecida (atômico com a auditoria). */
export async function insertProfile(
  trx: Knex.Transaction,
  profile: {
    name: string;
    description: string | null;
    isAssignableTriage: boolean;
    isAssignableMapping: boolean;
  },
): Promise<ProfileRow> {
  const inserted = (await trx("profiles")
    .insert({
      name: profile.name,
      description: profile.description,
      is_assignable_triage: profile.isAssignableTriage,
      is_assignable_mapping: profile.isAssignableMapping,
    })
    .returning("*")) as ProfileRow[];

  const row = inserted[0];

  if (!row) {
    throw new AppError("Falha ao criar o perfil", 500);
  }

  return row;
}

/** Atualiza só os campos presentes; grava `updated_at`. 404 se o Perfil sumiu. */
export async function updateProfileFields(
  trx: Knex.Transaction,
  id: number,
  patch: {
    name?: string;
    description?: string | null;
    isAssignableTriage?: boolean;
    isAssignableMapping?: boolean;
    isActive?: boolean;
  },
): Promise<void> {
  const payload: Record<string, unknown> = {};

  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.isAssignableTriage !== undefined) {
    payload.is_assignable_triage = patch.isAssignableTriage;
  }
  if (patch.isAssignableMapping !== undefined) {
    payload.is_assignable_mapping = patch.isAssignableMapping;
  }
  if (patch.isActive !== undefined) payload.is_active = patch.isActive;

  if (Object.keys(payload).length === 0) {
    return;
  }

  payload.updated_at = trx.fn.now();

  const updated = await trx("profiles").where({ profile_id: id }).update(payload);

  if (updated === 0) {
    throw new AppError("Perfil não encontrado", 404);
  }
}

/** Substituição integral da composição — nunca merge (contrato § 2.1). */
export async function replacePermissions(
  trx: Knex.Transaction,
  profileId: number,
  permissions: readonly { key: string; custody: string }[],
): Promise<void> {
  await trx("profile_permissions").where({ profile_id: profileId }).del();

  if (permissions.length === 0) {
    return;
  }

  await trx("profile_permissions").insert(
    permissions.map((permission) => ({
      profile_id: profileId,
      permission_key: permission.key,
      custody: permission.custody,
    })),
  );
}

/**
 * Protocolos das solicitações abertas (status não terminal) atribuídas a
 * usuários do Perfil, na etapa indicada — a guarda 6 lista esses protocolos.
 *
 * A atribuição vive em `requests.professional_id` (triagem) e em
 * `requests.mapping_professional_id` (mapeamento), ambos referenciando a
 * extensão de profissional do usuário.
 */
export async function listOpenAssignedProtocols(
  profileId: number,
  stage: AssignabilityStage,
): Promise<string[]> {
  const assignedColumn = stage === "triage" ? "r.professional_id" : "r.mapping_professional_id";

  const rows = (await db("requests as r")
    .join("details_professional as dp", "dp.professional_id", assignedColumn)
    .join("users as u", "u.user_id", "dp.user_id")
    .join("statuses as s", "s.status_id", "r.status_id")
    .where("u.profile_id", profileId)
    .where("s.is_terminal", false)
    .distinct("r.protocol")
    .orderBy("r.protocol", "asc")) as Array<{ protocol: string }>;

  return rows.map((row) => row.protocol);
}
