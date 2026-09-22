import type { Knex } from "knex";
import type { QueueFilterQuery } from "../../shared/types/queue.types.ts";

export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
}

/**
 * Aplica a mesma semântica de filtros à listagem paginada e à exportação.
 * As queries consumidoras usam os aliases `requests`, `requester`, `status`,
 * `priority_tbl`, `assignee_user` e, quando há escopo, `mapping_assignee`.
 */
export function applyQueueFilters(query: Knex.QueryBuilder, filters: QueueRepositoryFilters): void {
  const { search, status, priority, assigneeId, unassigned, scopedUserId } = filters;

  if (search) {
    query.andWhere((builder) => {
      builder
        .where("requests.protocol", "ilike", `%${search}%`)
        .orWhere("requester.corporate_email", "ilike", `%${search}%`)
        .orWhere("requester.full_name", "ilike", `%${search}%`);
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
