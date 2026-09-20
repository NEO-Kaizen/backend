import { findQueueRequests, fetchQueueMetrics, fetchAllAssignees } from "./queue.repository.ts";
import type {
  QueueQuery,
  QueueResponse,
  QueueMetricsResponse,
} from "../../shared/types/queue.types.ts";
import type { AuthenticatedUser } from "../../shared/types/user.ts";

/**
 * Escopo de visibilidade da fila por perfil (issue #102).
 *
 * O Analista enxerga apenas as solicitações em que é responsável — de triagem
 * ou de mapeamento. `Gestor` e `Administrador` permanecem sem restrição.
 * Retorna o `user_id` do próprio ator (mesmo identificador usado pelo frontend);
 * `0` não existe em `users.user_id` e atua como fail-safe para um id inválido.
 */
const resolveQueueScope = (actor?: AuthenticatedUser): number | undefined => {
  if (actor?.role !== "Analista") return undefined;

  const userId = Number(actor.id);
  return Number.isInteger(userId) && userId > 0 ? userId : 0;
};

export const getQueueMetricsService = async (
  actor?: AuthenticatedUser,
): Promise<QueueMetricsResponse> => {
  return await fetchQueueMetrics(resolveQueueScope(actor));
};

/** Serializa `created_at` (vem como `Date` do pg ou string) em ISO para o contrato. */
function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export const listQueueService = async (
  filters: QueueQuery,
  actor?: AuthenticatedUser,
): Promise<QueueResponse> => {
  const { page, pageSize, search, status, priority, assigneeId, unassigned } = filters;
  const offset = (page - 1) * pageSize;

  const repoUnassigned = Boolean(unassigned || assigneeId === "unassigned");
  const repoAssigneeId =
    typeof assigneeId === "string" && assigneeId !== "unassigned" ? assigneeId : undefined;

  const [{ items, total }, assignees] = await Promise.all([
    findQueueRequests({
      search,
      status,
      priority,
      assigneeId: repoAssigneeId,
      unassigned: repoUnassigned,
      scopedUserId: resolveQueueScope(actor),
      limit: pageSize,
      offset,
    }),
    fetchAllAssignees(),
  ]);

  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  // Contrato de paginação (documentado no README): página além do limite é
  // ajustada para a última página válida; sem resultados, a página é 1.
  const effectivePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const formattedData = items.map((item) => ({
    protocol: item.protocol,
    createdAt: toIso(item.createdAt),
    processName: item.processName,
    priority: item.priority,
    status: item.status,
    assignee: item.assignee ?? null,
    requesterName: item.requesterName,
    requesterEmail: item.requesterEmail,
    assigneeId: item.assigneeId ?? null,
  }));

  return {
    data: formattedData,
    page: effectivePage,
    pageSize,
    total,
    totalPages,
    assignees,
  };
};
