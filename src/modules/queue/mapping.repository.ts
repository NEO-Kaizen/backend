// Camada de dados do subfluxo de Mapeamento (issue #86).
//
// Agregado próprio (não estende queue.repository.ts — SRP): acesso a
// `mappings`, `mapping_participants` e ao contexto da solicitação necessário
// para autorização e conclusão (`requests` + `details_professional` + `users`).
//
// A busca de participantes na LEITURA faz LEFT JOIN com `users` para resolver
// nome/e-mail do cadastro (fonte fresca); na ESCRITA, o service resolve pelo
// cadastro e persiste os valores canônicos (divergência do payload ignorada).
import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import type { RequestStatus } from "../../shared/types/requests.ts";
import type { MappingValues, ResolvedParticipant } from "../DTOs/queue/mapping.dto.ts";

/** Linha da tabela `mappings`. */
export interface MappingRow {
  mapping_id: string;
  request_id: string;
  professional_id: string | null;
  scheduled_for: Date | string | null;
  duration_minutes: number | null;
  modality: "REMOTE" | "IN_PERSON" | null;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  is_concluded: boolean;
  concluded_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string | null;
}

/**
 * Participante lido para a resposta: `userId` é o `users.user_id` (null para
 * participante externo). `id` da resposta = `String(userId)` — o `mapping_id`
 * (uuid) pertence ao mapeamento, não ao participante.
 */
export interface MappingParticipantRow {
  userId: number | null;
  name: string;
  email: string;
}

/** Contexto da solicitação para autorização/conclusão do mapeamento. */
export interface MappingRequestContext {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  status: RequestStatus;
  /** `details_professional.user_id` do responsável (id de `users`, não UUID). */
  assignee_user_id: number | null;
}

/** Candidato a designado do mapeamento (mínimo para elegibilidade + resposta). */
export interface MappingAssigneeCandidate {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
  professional_status: "active" | "inactive";
  user_is_active: boolean;
  profile_name: string;
}

/**
 * Contexto da solicitação (protocolo → request) com o status atual e o
 * responsável vinculado. `null` quando o protocolo não existe.
 *
 * Aceita `queryable` (conexão `db` ou `trx`) — o service re-lê dentro da
 * transação para fechar a janela TOCTOU entre a checagem e o commit.
 */
export const findMappingRequestContext = async (
  queryable: Knex,
  protocol: string,
): Promise<MappingRequestContext | null> => {
  const row = await queryable("requests")
    .join("statuses as s", "s.status_id", "requests.status_id")
    .leftJoin("details_professional as dp", "dp.professional_id", "requests.professional_id")
    .where("requests.protocol", protocol)
    .first({
      request_id: "requests.request_id",
      protocol: "requests.protocol",
      professional_id: "requests.professional_id",
      status: "s.name",
      assignee_user_id: "dp.user_id",
    });

  return row ?? null;
};

/**
 * Candidato a designado do mapeamento por `professional_id` (uuid). Elegibilidade
 * mínima devolvida (sem filtro) — o service aplica o motivo da rejeição,
 * mesmo padrão do `findAssignmentCandidateById` do módulo `requests`.
 * Aceita `queryable` (conexão `db` ou `trx`) para leituras consistentes
 * dentro da transação do `PUT`.
 */
export const findMappingAssigneeCandidate = async (
  queryable: Knex,
  professionalId: string | null,
): Promise<MappingAssigneeCandidate | null> => {
  if (professionalId === null) {
    return null;
  }

  const row = await queryable("details_professional as dp")
    .join("users as u", "u.user_id", "dp.user_id")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("dp.professional_id", professionalId)
    .first({
      id: "dp.professional_id",
      userId: "dp.user_id",
      name: "u.full_name",
      email: "u.email",
      jobTitle: "dp.job_title",
      professional_status: "dp.status",
      user_is_active: "u.is_active",
      profile_name: "p.name",
    });

  return row ?? null;
};

/** Mapeamento mais recente da solicitação (inclusive concluído) — resposta do GET. */
export const findCurrentMapping = async (
  queryable: Knex,
  requestId: string,
): Promise<MappingRow | null> => {
  const row = await queryable("mappings")
    .where({ request_id: requestId })
    .orderBy("created_at", "desc")
    .orderBy("updated_at", "desc")
    .first();

  return row ?? null;
};

/** Mapeamento aberto (não concluído) mais recente — alvo do PUT sem `id`. */
export const findLatestOpenMapping = async (
  queryable: Knex,
  requestId: string,
): Promise<MappingRow | null> => {
  const row = await queryable("mappings")
    .where({ request_id: requestId, is_concluded: false })
    .orderBy("created_at", "desc")
    .orderBy("updated_at", "desc")
    .first();

  return row ?? null;
};

/** Mapeamento por id, restrito à solicitação — alvo do PUT com `id`. */
export const findMappingById = async (
  queryable: Knex,
  requestId: string,
  mappingId: string,
): Promise<MappingRow | null> => {
  const row = await queryable("mappings")
    .where({ request_id: requestId, mapping_id: mappingId })
    .first();

  return row ?? null;
};

/**
 * Participantes do mapeamento. Com `user_id`, nome/e-mail são resolvidos na
 * leitura pelo `users` (fonte fresca, divergências antigas nunca vazam); sem
 * `user_id`, retorna o participante externo como persistido.
 * Ordenação determinística: `created_at` (inserção) + `participant_id` como
 * tiebreaker (todos os `created_at` de uma transação são idênticos).
 */
export const findMappingParticipants = async (
  queryable: Knex,
  mappingId: string,
): Promise<MappingParticipantRow[]> => {
  return queryable("mapping_participants as mp")
    .leftJoin("users as u", "u.user_id", "mp.user_id")
    .where("mp.mapping_id", mappingId)
    .orderBy("mp.created_at", "asc")
    .orderBy("mp.participant_id", "asc")
    .select({
      userId: "mp.user_id",
      name: db.raw("COALESCE(u.full_name, mp.name)"),
      email: db.raw("COALESCE(u.email, mp.email)"),
    });
};

/**
 * Resolve os usuários informados como participantes (via `users.user_id`).
 * Usuário inexistente ou inativo (`users.is_active` **ou** `profiles.is_active`
 * falso — o mesmo critério do `authMiddleware`) → `422`. Retorna mapa
 * `user_id → cadastro`.
 */
export const resolveParticipantUsers = async (
  queryable: Knex,
  userIds: number[],
): Promise<Map<number, { user_id: number; full_name: string; email: string }>> => {
  if (userIds.length === 0) {
    return new Map();
  }

  const rows = await queryable("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .whereIn("u.user_id", userIds)
    .select(
      "u.user_id",
      "u.full_name",
      "u.email",
      "u.is_active as user_is_active",
      "p.is_active as profile_is_active",
    );

  const invalid = userIds.filter((id) => {
    const row = rows.find((r) => r.user_id === id);
    return !row || !row.user_is_active || !row.profile_is_active;
  });

  if (invalid.length > 0) {
    throw new AppError("Participante inválido: usuário inexistente ou inativo.", 422);
  }

  return new Map(
    rows.map((row) => [
      row.user_id,
      { user_id: row.user_id, full_name: row.full_name, email: row.email },
    ]),
  );
};

export const insertMapping = async (
  trx: Knex.Transaction,
  args: {
    requestId: string;
    professionalId: string | null;
    values: MappingValues;
    createdBy: string;
  },
): Promise<string> => {
  const [row] = await trx("mappings")
    .insert({
      request_id: args.requestId,
      professional_id: args.professionalId,
      scheduled_for: args.values.scheduledFor,
      duration_minutes: args.values.durationMinutes,
      modality: args.values.modality,
      meeting_link: args.values.meetingLink,
      location: args.values.location,
      notes: args.values.notes,
      created_by: args.createdBy,
      created_at: trx.fn.now(),
    })
    .returning("mapping_id");

  return row.mapping_id as string;
};

export const updateMapping = async (
  trx: Knex.Transaction,
  mappingId: string,
  values: MappingValues,
  updatedBy: string,
  conclude: boolean,
  professionalId?: string | null,
): Promise<void> => {
  await trx("mappings")
    .where({ mapping_id: mappingId })
    .update({
      scheduled_for: values.scheduledFor,
      duration_minutes: values.durationMinutes,
      modality: values.modality,
      meeting_link: values.meetingLink,
      location: values.location,
      notes: values.notes,
      updated_by: updatedBy,
      updated_at: trx.fn.now(),
      // Apenas a conclusão toca nos flags — rascunho não reescreve `concluded_at`.
      ...(conclude ? { is_concluded: true, concluded_at: trx.fn.now() } : {}),
      // Designação própria do mapeamento — `undefined` mantém o designado atual.
      ...(professionalId !== undefined ? { professional_id: professionalId } : {}),
    });
};

/** Substituição atômica dos participantes (delete + insert na mesma transação). */
export const replaceMappingParticipants = async (
  trx: Knex.Transaction,
  mappingId: string,
  participants: ResolvedParticipant[],
): Promise<void> => {
  await trx("mapping_participants").where({ mapping_id: mappingId }).del();

  if (participants.length === 0) {
    return;
  }

  await trx("mapping_participants").insert(
    participants.map((participant) => ({
      mapping_id: mappingId,
      user_id: participant.userId,
      name: participant.name,
      email: participant.email.toLowerCase(),
      created_at: trx.fn.now(),
    })),
  );
};
