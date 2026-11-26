import type { Knex } from "knex";
import type { QueueSortBy, QueueSortOrder } from "../../shared/types/queue.types.ts";

/** Colunas permitidas, mapeadas a partir do contrato público (issue #215). */
const SORT_COLUMNS = {
  createdAt: "requests.created_at",
  protocol: "requests.protocol",
  requesterName: "requester.full_name",
  status: "status.name",
  priority: "priority_tbl.level",
  assignee: "assignee_user.full_name",
} as const satisfies Record<QueueSortBy, string>;

export const DEFAULT_SORT_BY: QueueSortBy = "createdAt";
export const DEFAULT_SORT_ORDER: QueueSortOrder = "desc";

/**
 * Aplica a ordenação da fila sem aceitar SQL do cliente: o valor recebido já
 * passou pelo enum do schema. O desempate por protocolo mantém a paginação
 * determinística quando duas linhas têm o mesmo valor ordenado.
 */
export function applyQueueSort(
  query: Knex.QueryBuilder,
  sortBy: QueueSortBy = DEFAULT_SORT_BY,
  sortOrder: QueueSortOrder = DEFAULT_SORT_ORDER,
): void {
  query.orderBy(SORT_COLUMNS[sortBy], sortOrder);

  if (sortBy !== "protocol") {
    query.orderBy("requests.protocol", "asc");
  }
}
