import type { Knex } from "knex";
import type { QueueFilterQuery } from "../../shared/types/queue.types.ts";

/** Mesmo dia comercial usado pelo dashboard para filtros de abertura. */
const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
  noteCustodianUserId?: number;
}

/**
 * Aplica a mesma semântica de filtros à listagem paginada e à exportação.
 * As queries consumidoras usam os aliases `requests`, `requester`, `status`,
 * `priority_tbl`, `assignee_user` e, quando há escopo, `mapping_assignee`.
 *
 * A busca inclui notas internas, então este helper só pode ser usado por
 * consultas internas (`GET /queue` e exportação CSV de Gestor/Administrador).
 *
 * Dois limites são distintos: `scopedUserId` é o escopo da fila (triagem ou
 * mapeamento); `noteCustodianUserId` é a custódia de `internal_note:read` e
 * vale somente para a correspondência em notas. O responsável de mapeamento
 * amplia a fila, mas não amplia a busca por nota. Os filtros de data e
 * departamento (issue #215) entram no mesmo conjunto e, portanto, também
 * valem para a exportação CSV.
 */
export function applyQueueFilters(query: Knex.QueryBuilder, filters: QueueRepositoryFilters): void {
  const {
    search,
    status,
    priority,
    assigneeId,
    unassigned,
    dateFrom,
    dateTo,
    department,
    scopedUserId,
    noteCustodianUserId,
  } = filters;

  if (search) {
    const searchPattern = `%${search}%`;

    query.andWhere((builder) => {
      builder
        .where("requests.protocol", "ilike", searchPattern)
        .orWhere("requester.corporate_email", "ilike", searchPattern)
        .orWhere("requester.full_name", "ilike", searchPattern)
        .orWhere("requests.need_description", "ilike", searchPattern)
        .orWhere("requests.problem_opportunity", "ilike", searchPattern)
        .orWhereExists((notesQuery) => {
          notesQuery
            .select(1)
            .from("request_internal_notes as note")
            .whereRaw("note.request_id = requests.request_id")
            .andWhere("note.content", "ilike", searchPattern);

          if (noteCustodianUserId !== undefined) {
            notesQuery.andWhere("assignee_user.user_id", noteCustodianUserId);
          }
        });
    });
  }

  if (dateFrom) {
    query.whereRaw(`"requests"."created_at" >= (?::date AT TIME ZONE ?)`, [
      dateFrom,
      BUSINESS_TIME_ZONE,
    ]);
  }

  if (dateTo) {
    // Intervalo semiaberto: `dateTo` é inclusivo mesmo para registros no fim do dia.
    query.whereRaw(`"requests"."created_at" < ((?::date + INTERVAL '1 day') AT TIME ZONE ?)`, [
      dateTo,
      BUSINESS_TIME_ZONE,
    ]);
  }

  if (department) {
    query.whereRaw(`lower("requester"."department") = lower(?)`, [department]);
  }

  if (status) query.andWhere("status.name", status);

  if (priority === "nenhum") {
    query.whereNull("requests.priority_id");
  } else if (priority) {
    query.andWhere("priority_tbl.level", priority);
  }

  if (unassigned || assigneeId === "unassigned") {
    query.whereNull("requests.professional_id");
  } else if (assigneeId) {
    if (/^\d+$/.test(assigneeId)) {
      query.andWhere("assignee_user.user_id", Number(assigneeId));
    } else {
      query.andWhere("requests.professional_id", assigneeId);
    }
  }

  // Analistas continuam restritos às solicitações sob responsabilidade deles.
  if (scopedUserId !== undefined) {
    query.andWhere((builder) => {
      builder
        .where("assignee_user.user_id", scopedUserId)
        .orWhere("mapping_assignee.user_id", scopedUserId);
    });
  }
}
