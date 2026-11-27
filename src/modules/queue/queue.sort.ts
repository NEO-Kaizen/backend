import type { Knex } from "knex";
import type { QueueSortBy, QueueSortOrder } from "../../shared/types/queue.types.ts";

/**
 * Colunas permitidas, mapeadas do contrato público (issue #215 / RF04).
 * Status e Prioridade usam chaves ordenáveis do domínio — não o texto exibido —
 * para que a direção aplicada corresponda à ordem do ciclo de vida e da
 * gravidade.
 */
const SORT_COLUMNS = {
  createdAt: "requests.created_at",
  protocol: "requests.protocol",
  status: "status.order_number",
  priority: "requests.priority_id",
} as const satisfies Record<QueueSortBy, string>;

const DEFAULT_SORT_BY: QueueSortBy = "createdAt";
const DEFAULT_SORT_ORDER: QueueSortOrder = "desc";

/**
 * Aplica a ordenação sem aceitar SQL do cliente: `sortBy` e `sortOrder` já
 * passaram pelos enums do schema. `NULLS LAST` mantém solicitações sem
 * prioridade no fim em ambas as direções, conforme o contrato RF04. Protocolo
 * é comparado sem diferenciar maiúsculas e usado como desempate das demais
 * colunas, tornando a paginação determinística.
 */
export function applyQueueSort(
  query: Knex.QueryBuilder,
  sortBy: QueueSortBy = DEFAULT_SORT_BY,
  sortOrder: QueueSortOrder = DEFAULT_SORT_ORDER,
): void {
  // A direção é uma palavra-chave SQL: normalize para não depender apenas do
  // enum em tempo de compilação.
  const direction = sortOrder === "asc" ? "asc" : "desc";

  if (sortBy === "protocol") {
    query.orderByRaw(`lower(??) ${direction} nulls last`, [SORT_COLUMNS.protocol]);
    return;
  }

  query.orderBy(SORT_COLUMNS[sortBy], direction, "last");
  query.orderByRaw("lower(??) asc", [SORT_COLUMNS.protocol]);
}
