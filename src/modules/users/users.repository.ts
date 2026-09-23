import { AppError } from "../../shared/errors/AppError.ts";
import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import type { AuthUserRow, UserMetricsResponse, UserRow } from "../../shared/types/user.ts";
import { resolveRole } from "../../shared/utils/roleUtils.ts";
import type {
  CreateProfessionalInput,
  CreateUserRequest,
  ListUsersQuery,
} from "../DTOs/users/UserRequests.dto.ts";
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
 *  na criação de conta. Apenas `analista`: a extensão é o card do analista e a
 *  elegibilidade de atribuição também é restrita a `analista`
 *  (ASSIGNABLE_PROFILES em requests.repository). */
export const PROFESSIONAL_PROFILES = ["analista"] as const;

/** True quando o perfil informado deve nascer com a extensão details_professional. */
export function isProfessionalProfile(profileName: string): boolean {
  return (PROFESSIONAL_PROFILES as readonly string[]).includes(profileName.trim().toLowerCase());
}

/**
 * Cria a extensão de profissional dentro da transação fornecida (atômica com a
 * criação do usuário). `professional_id` nasce do default da coluna
 * (gen_random_uuid()); `capacity` e `status` dos defaults do schema (5/"active").
 * `specialties` e `attended_category_ids` são textos separados por vírgula —
 * mesmo formato lido pelo card (split em `listAnalysts`).
 */
export async function createProfessionalData(
  trx: Knex.Transaction,
  userId: number,
  professional: CreateProfessionalInput,
): Promise<void> {
  await trx("details_professional").insert({
    user_id: userId,
    job_title: professional.jobTitle,
    specialties: professional.specialties.join(", "),
    attended_category_ids: professional.attendedCategoryIds.join(","),
    notes: professional.notes ?? null,
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
      email: payload.email.trim().toLowerCase(),
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

/**
 * Cria a extensão de solicitante dentro da transação fornecida (atômica com a
 * criação do usuário). Todo usuário é requester: `requesters` funciona como
 * extensão 1:1 de `users` via `user_id`.
 *
 * `area`/`department`/`manager_name`/`additional_contact` nascem nulos (dados
 * de contato só fazem sentido no contexto de uma solicitação); `resolveRequesterId`
 * sincroniza esses campos antes da primeira solicitação autenticada.
 *
 * Caso de borda tratado: um requester **anônimo** com o mesmo e-mail (solicitação
 * criada sem conta antes do `POST /users`) é **adotado** pelo usuário em vez de
 * gerar duplicata (`uk_requesters_email`). O merge liga o `user_id` e atualiza o
 * nome; `area`/`manager_name` existentes são preservados até o `resolveRequesterId`.
 * A regra 1:1 (`uk_requesters_user`) nunca é violada porque a linha anônima tem
 * `user_id = NULL` — e e-mails de usuários já cadastrados param no `users` (409).
 */
export async function createRequesterData(
  trx: Knex.Transaction,
  user: UserRow,
  requester?: {
    area: string;
    department?: string;
    manager: string;
    additionalContact?: string | null;
  },
): Promise<void> {
  const corporateEmail = user.email.trim().toLowerCase();

  // Sem requester no payload (legado) ainda insere nulls — mantido para compatibilidade de testes antigos.
  // Novo contrato: POST /users exige requester, então area/manager virão preenchidos.
  const hasRequester = requester !== undefined;

  await trx("requesters")
    .insert({
      user_id: user.user_id,
      full_name: user.full_name,
      corporate_email: corporateEmail,
      area: hasRequester ? requester.area : null,
      department: hasRequester ? (requester.department ?? null) : null,
      manager_name: hasRequester ? requester.manager : null,
      additional_contact: hasRequester ? (requester.additionalContact ?? null) : null,
    })
    .onConflict("corporate_email")
    // Só adota linha anônima (`user_id IS NULL`): nunca reassina a extensão de
    // outro usuário com o mesmo e-mail (caso raro de dados legados).
    .merge(
      hasRequester
        ? {
            user_id: user.user_id,
            full_name: user.full_name,
            area: requester.area,
            department: requester.department ?? null,
            manager_name: requester.manager,
            additional_contact: requester.additionalContact ?? null,
          }
        : { user_id: user.user_id, full_name: user.full_name },
    )
    .whereRaw("requesters.user_id is null");
}

/**
 * Carrega o perfil completo do usuário para `GET /users/me`:
 * - dados de `users` + `profiles` (role/name)
 * - bloco `requester` (1:1 via user_id) — NULL se não existir
 * - bloco `professional` (1:1 via user_id) — NULL se não existir
 *
 * `specialties`/`attended_category_ids` são desencontradas do texto
 * separado por vírgula (formato do seed/createProfessionalData) para
 * array — mesmo parsing do card (`listAnalysts`).
 */
export interface UserProfileRow {
  user_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  profile_name: string;
  requester: {
    area: string | null;
    department: string | null;
    manager_name: string | null;
    additional_contact: string | null;
  } | null;
  professional: {
    job_title: string | null;
    specialties: string[];
    attended_category_ids: number[];
    notes: string | null;
  } | null;
}

export async function findUserProfile(userId: number): Promise<UserProfileRow | undefined> {
  const user = await db("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("u.user_id", userId)
    .first("u.user_id", "u.full_name", "u.email", "u.avatar_url", "p.name as profile_name");

  if (!user) return undefined;

  const [requester, professional] = await Promise.all([
    db("requesters")
      .where({ user_id: userId })
      .first("area", "department", "manager_name", "additional_contact"),
    db("details_professional")
      .where({ user_id: userId })
      .first("job_title", "specialties", "attended_category_ids", "notes"),
  ]);

  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    avatar_url: user.avatar_url ?? null,
    profile_name: user.profile_name,
    requester: requester
      ? {
          area: requester.area ?? null,
          department: requester.department ?? null,
          manager_name: requester.manager_name ?? null,
          additional_contact: requester.additional_contact ?? null,
        }
      : null,
    professional: professional
      ? {
          job_title: professional.job_title ?? null,
          specialties: professional.specialties ? professional.specialties.split(", ") : [],
          attended_category_ids: professional.attended_category_ids
            ? professional.attended_category_ids.split(",").map((id: string) => Number(id))
            : [],
          notes: professional.notes ?? null,
        }
      : null,
  };
}

/**
 * Upsert da extensão de solicitante por `user_id` (1:1).
 * Garante a presença da linha para o "Meus dados" — três cenários:
 * 1. Linha existente para este `user_id` → apenas atualiza campos editáveis.
 * 2. Linha anônima com o mesmo e-mail (`user_id = NULL`) → adota (vincula
 *    o `user_id`); mantém `area`/`manager_name` existentes até o
 *    `resolveRequesterId` do fluxo de solicitação.
 * 3. Nenhuma linha → insere nova (requer `fullName`/`corporateEmail`
 *    do usuário, que são NOT NULL no banco).
 * `uk_requesters_email` jamais é violado (adoção guardada por
 * `user_id IS NULL`).
 */
export async function upsertRequesterData(
  trx: Knex.Transaction,
  userId: number,
  data: {
    fullName: string; // para INSERT; não é atualizado nos demais cenários (imutável)
    corporateEmail: string; // idem
    area: string;
    department?: string;
    managerName: string;
    additionalContact?: string | null;
  },
): Promise<void> {
  // 1. Linha existente para este usuário.
  const updated = await trx("requesters")
    .where({ user_id: userId })
    .update({
      area: data.area,
      department: data.department ?? null,
      manager_name: data.managerName,
      additional_contact: data.additionalContact ?? null,
    });
  if (updated > 0) return;

  // 2. Adota linha anônima com o mesmo e-mail (jamais reatribui extensão de terceiros).
  const adopted = await trx("requesters")
    .where({ corporate_email: data.corporateEmail })
    .whereNull("user_id")
    .update({
      user_id: userId,
      full_name: data.fullName,
      area: data.area,
      department: data.department ?? null,
      manager_name: data.managerName,
      additional_contact: data.additionalContact ?? null,
    });
  if (adopted > 0) return;

  // 3. Nova linha.
  await trx("requesters").insert({
    user_id: userId,
    full_name: data.fullName,
    corporate_email: data.corporateEmail,
    area: data.area,
    department: data.department ?? null,
    manager_name: data.managerName,
    additional_contact: data.additionalContact ?? null,
  });
}

/**
 * Upsert da extensão profissional por `user_id` (1:1).
 * Garante presença no "Meus dados" para analistas legados.
 * `status`/`capacity` NÃO são alterados (defaults do schema).
 * `specialties`/`attended_category_ids` são serializados como texto
 * separado por vírgula (mesmo formato do seed/`createProfessionalData`).
 */
export async function upsertProfessionalData(
  trx: Knex.Transaction,
  userId: number,
  professional: CreateProfessionalInput,
): Promise<void> {
  const specialties = professional.specialties.join(", ");
  const attendedCategoryIds = professional.attendedCategoryIds.join(",");

  // 1. Linha existente para este usuário.
  const updated = await trx("details_professional")
    .where({ user_id: userId })
    .update({
      job_title: professional.jobTitle,
      specialties,
      attended_category_ids: attendedCategoryIds,
      notes: professional.notes ?? null,
    });
  if (updated > 0) return;

  // 2. Nova linha.
  await trx("details_professional").insert({
    user_id: userId,
    job_title: professional.jobTitle,
    specialties,
    attended_category_ids: attendedCategoryIds,
    notes: professional.notes ?? null,
  });
}

/** Define `users.avatar_url` (URL do arquivo em `uploads/avatars/`). */
export async function setUserAvatar(
  trx: Knex.Transaction,
  userId: number,
  url: string,
): Promise<void> {
  await trx("users")
    .where({ user_id: userId })
    .update({ avatar_url: url, updated_at: trx.fn.now() });
}

/** Remove `users.avatar_url` (deixa null; arquivo no disco removido pelo serviço). */
export async function removeUserAvatar(trx: Knex.Transaction, userId: number): Promise<void> {
  await trx("users")
    .where({ user_id: userId })
    .update({ avatar_url: null, updated_at: trx.fn.now() });
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

/** Atualiza campos básicos de `users` dentro da transação (merge — ausente mantém). */
export async function updateUserFields(
  trx: Knex.Transaction,
  id: number,
  fields: { fullName?: string; email?: string; profileId?: number },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (fields.fullName !== undefined) patch.full_name = fields.fullName.trim();
  if (fields.email !== undefined) patch.email = fields.email.trim().toLowerCase();
  if (fields.profileId !== undefined) patch.profile_id = fields.profileId;
  if (Object.keys(patch).length === 0) return;
  patch.updated_at = trx.fn.now();
  const updated = await trx("users").where({ user_id: id }).update(patch);
  if (updated === 0) {
    throw new AppError("Usuário não encontrado", 404);
  }
}

/** Remove extensão profissional (quando role deixa de ser analista). */
export async function deleteProfessionalData(trx: Knex.Transaction, userId: number): Promise<void> {
  await trx("details_professional").where({ user_id: userId }).del();
}

/** Sincroniza `requesters.full_name/corporate_email` após troca de nome/e-mail do usuário. */
export async function syncRequesterIdentity(
  trx: Knex.Transaction,
  userId: number,
  identity: { fullName: string; corporateEmail: string },
): Promise<void> {
  await trx("requesters").where({ user_id: userId }).update({
    full_name: identity.fullName.trim(),
    corporate_email: identity.corporateEmail.trim().toLowerCase(),
  });
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
  professional_id: string | null;
}

export async function listAnalysts(): Promise<AssignAnalyst[]> {
  const rows = (await db("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    // LEFT JOIN defensivo: usuário sem extensão (recém-criado ou dados antigos)
    // ainda aparece no card com campos vazios — formato já previsto no contrato.
    // A regra de licença (extensão com status 'inactive') permanece filtrando:
    // o WHERE compensa o LEFT JOIN para excluir apenas extensões inativas.
    .leftJoin("details_professional as dp", "dp.user_id", "u.user_id")
    .where("p.name", "analista")
    .andWhere("p.is_active", true)
    .andWhere("u.is_active", true)
    .andWhere((builder) => {
      builder.where("dp.status", "active").orWhereNull("dp.user_id");
    })
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
  // Analista SEM extensão não entra no COUNT (sem professional_id válido).
  const professionalIds = rows
    .map((r) => r.professional_id)
    .filter((id): id is string => id !== null);
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
      // Sem extensão não há carga para contar; contrato permite null.
      requestLoad:
        row.professional_id === null ? null : (countByProfessional.get(row.professional_id) ?? 0),
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

/**
 * Merge helper para `PUT /users/:id` — atualiza `requesters` de forma parcial.
 * Ausente mantém; definido substitui. Garante presença da linha 1:1.
 */
export async function mergeRequesterData(
  trx: Knex.Transaction,
  userId: number,
  fullName: string,
  corporateEmail: string,
  patch: {
    area?: string;
    department?: string;
    manager?: string;
    additionalContact?: string | null;
  },
): Promise<void> {
  const existing = await trx("requesters")
    .where({ user_id: userId })
    .first("area", "department", "manager_name", "additional_contact");

  if (existing) {
    const next = {
      area: (patch.area ?? existing.area) as string | null,
      department: patch.department !== undefined ? (patch.department ?? null) : existing.department,
      manager_name: (patch.manager ?? existing.manager_name) as string | null,
      additional_contact:
        patch.additionalContact !== undefined
          ? (patch.additionalContact ?? null)
          : existing.additional_contact,
    };
    await trx("requesters").where({ user_id: userId }).update({
      area: next.area,
      department: next.department,
      manager_name: next.manager_name,
      additional_contact: next.additional_contact,
    });
    return;
  }

  const anon = await trx("requesters")
    .where({ corporate_email: corporateEmail.trim().toLowerCase() })
    .whereNull("user_id")
    .first("area", "department", "manager_name", "additional_contact");

  if (anon) {
    await trx("requesters")
      .where({ corporate_email: corporateEmail.trim().toLowerCase() })
      .whereNull("user_id")
      .update({
        user_id: userId,
        full_name: fullName,
        area: patch.area ?? anon.area,
        department: patch.department !== undefined ? (patch.department ?? null) : anon.department,
        manager_name: patch.manager ?? anon.manager_name,
        additional_contact:
          patch.additionalContact !== undefined
            ? (patch.additionalContact ?? null)
            : anon.additional_contact,
      });
    return;
  }

  await trx("requesters").insert({
    user_id: userId,
    full_name: fullName,
    corporate_email: corporateEmail.trim().toLowerCase(),
    area: patch.area ?? null,
    department: patch.department ?? null,
    manager_name: patch.manager ?? null,
    additional_contact: patch.additionalContact ?? null,
  });
}

export async function findRequesterByUserId(userId: number) {
  return db("requesters").where({ user_id: userId }).first();
}
