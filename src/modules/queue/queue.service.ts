import {
  findQueueRequests,
  fetchQueueMetrics,
  fetchAllAssignees,
  fetchAllDepartments,
} from "./queue.repository.ts";
import type {
  QueueQuery,
  QueueResponse,
  QueueMetricsResponse,
} from "../../shared/types/queue.types.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { custodyFor, resolveResponsibleScope } from "../../shared/access/custody.ts";
import type { PermissionActor } from "../../shared/access/permissionActor.ts";

/**
 * Escopo de visibilidade da fila pela Custódia de `queue:read`: `all` vê tudo,
 * `assigned` vê só as solicitações em que é Responsável. O responsável do
 * mapeamento não amplia o escopo (§ 5 do contrato RBAC).
 */
const resolveQueueScope = (actor: PermissionActor): number | undefined => {
  const scope = resolveResponsibleScope(actor.permissions, "queue:read", actor.id);
  if (!scope) {
    throw new AppError("Custódia inválida para queue:read.", 403);
  }

  return scope.kind === "assigned" ? scope.userId : undefined;
};

/**
 * Custódia da busca por notas internas: `internal_note:read` em `assigned`
 * restringe a correspondência às solicitações sob responsabilidade do ator;
 * `all` não adiciona recorte ao `EXISTS`. Quem não tem a chave recebe `0` —
 * um `user_id` inexistente — para que a busca não encontre nenhuma nota.
 */
const resolveNoteCustodianUserId = (actor: PermissionActor): number | undefined => {
  const custody = custodyFor(actor.permissions, "internal_note:read");

  if (custody === "all") return undefined;
  if (custody === "assigned") return actor.id;

  return 0;
};

export const getQueueMetricsService = async (
  actor: PermissionActor,
): Promise<QueueMetricsResponse> => {
  return await fetchQueueMetrics(resolveQueueScope(actor));
};

/** Serializa `created_at` (vem como `Date` do pg ou string) em ISO para o contrato. */
function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export const listQueueService = async (
  filters: QueueQuery,
  actor: PermissionActor,
): Promise<QueueResponse> => {
  const { page, pageSize, assigneeId, sortBy, sortOrder, ...queueFilters } = filters;
  const offset = (page - 1) * pageSize;

  const repoUnassigned = Boolean(queueFilters.unassigned || assigneeId === "unassigned");
  const repoAssigneeId =
    typeof assigneeId === "string" && assigneeId !== "unassigned" ? assigneeId : undefined;
  const scopedUserId = resolveQueueScope(actor);
  const noteCustodianUserId = resolveNoteCustodianUserId(actor);

  const [{ items, total }, assignees, departments] = await Promise.all([
    findQueueRequests({
      ...queueFilters,
      assigneeId: repoAssigneeId,
      unassigned: repoUnassigned,
      sortBy,
      sortOrder,
      // Escopo da fila e custódia da nota são regras diferentes, resolvidas
      // por chaves distintas (`queue:read` e `internal_note:read`).
      scopedUserId,
      noteCustodianUserId,
      limit: pageSize,
      offset,
    }),
    fetchAllAssignees(),
    fetchAllDepartments(),
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
    departments,
  };
};
