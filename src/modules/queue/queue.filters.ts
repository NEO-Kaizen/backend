import type { Knex } from "knex";
import type { QueueFilterQuery } from "../../shared/types/queue.types.ts";

export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
}

/**
 * Aplica a mesma semântica de filtros à listagem paginada e à exportação.
 * As queries consumidoras usam os aliases `requests`, `requester`, `status`,
 * `priority_tbl`, `assignee_user` e, quando há escopo, `mapping_assignee`.
 *
 * A busca inclui notas internas, então este helper só pode ser usado por
 * consultas internas (`GET /queue` e exportação CSV de Gestor/Administrador).
 * O escopo do Analista já restringe `requests` na mesma consulta.
 */
export function applyQueueFilters(query: Knex.QueryBuilder, filters: QueueRepositoryFilters): void {
  const { search, status, priority, assigneeId, unassigned, scopedUserId } = filters;

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
        });
    });
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
