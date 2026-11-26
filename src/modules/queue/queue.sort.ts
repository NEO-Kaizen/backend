import type { Knex } from "knex";
import type { QueueSortBy, QueueSortOrder } from "../../shared/types/queue.types.ts";

/**
 * Colunas permitidas, mapeadas a partir do contrato público (issue #215).
 * Status e Prioridade usam chaves ordenáveis do domínio — não o texto exibido —
 * para que a direção aplicada corresponda à ordem do ciclo de vida e da
 * gravidade.
 */
const SORT_COLUMNS = {
  createdAt: "requests.created_at",
  protocol: "requests.protocol",
  requesterName: "requester.full_name",
  status: "status.order_number",
  priority: "requests.priority_id",
  assignee: "assignee_user.full_name",
} as const satisfies Record<QueueSortBy, string>;

const DEFAULT_SORT_BY: QueueSortBy = "createdAt";
const DEFAULT_SORT_ORDER: QueueSortOrder = "desc";

/**
 * Aplica a ordenação da fila sem aceitar SQL do cliente: o valor recebido já
 * passou pelo enum do schema. `NULLS LAST` evita que ausência de prioridade ou
 * de responsável apareça no topo de uma ordenação descendente. O desempate por
 * protocolo mantém a paginação determinística, exceto quando o próprio
 * protocolo é o campo ordenado.
 */
export function applyQueueSort(
  query: Knex.QueryBuilder,
  sortBy: QueueSortBy = DEFAULT_SORT_BY,
  sortOrder: QueueSortOrder = DEFAULT_SORT_ORDER,
): void {
  query.orderBy(SORT_COLUMNS[sortBy], sortOrder, "last");

  if (sortBy !== "protocol") {
    query.orderBy("requests.protocol", "asc");
  }
}
