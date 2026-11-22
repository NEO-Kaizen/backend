import { findQueueRequests, fetchQueueMetrics, fetchAllAssignees } from "./queue.repository.ts";
import type {
  QueueQuery,
  QueueResponse,
  QueueMetricsResponse,
} from "../../shared/types/queue.types.ts";
import type { EffectivePermission } from "../../shared/catalog/permissionCatalog.ts";
import { resolveResponsibleScope } from "../../shared/access/custody.ts";

export interface QueueActor {
  readonly id: number;
  readonly permissions: readonly EffectivePermission[];
}

/**
 * Escopo de visibilidade da fila pela Custódia de `queue:read`: `all` vê tudo,
 * `assigned` vê só as solicitações em que é Responsável. O responsável do
 * mapeamento não amplia o escopo (§ 5 do contrato RBAC).
 */
const resolveQueueScope = (actor: QueueActor): number | undefined =>
  resolveResponsibleScope(actor.permissions, "queue:read", actor.id);

export const getQueueMetricsService = async (actor: QueueActor): Promise<QueueMetricsResponse> => {
  return await fetchQueueMetrics(resolveQueueScope(actor));
};

/** Serializa `created_at` (vem como `Date` do pg ou string) em ISO para o contrato. */
function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export const listQueueService = async (
  filters: QueueQuery,
  actor: QueueActor,
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
