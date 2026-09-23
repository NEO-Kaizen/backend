import type { RequestPriority, RequestStatus } from "./requests.ts";
import type { PaginatedResponse } from "./pagination.ts";

export interface RequestSummary {
  protocol: string;
  createdAt: string;
  processName: string;
  priority: RequestPriority | null;
  status: RequestStatus;
  assignee: string | null;
  requesterName: string;
}

export interface QueueMetricsResponse {
  totalRequests: number;
  unassignedRequests: number;
  inProgressRequests: number;
  overdueRequests: number;
}

export type QueuePriorityFilter = RequestPriority | "nenhum";

/** Filtros compartilhados pela fila paginada e pela exportação CSV. */
export interface QueueFilterQuery {
  search?: string;
  status?: RequestStatus;
  priority?: QueuePriorityFilter;
  assigneeId?: string | "unassigned";
  unassigned?: boolean;
}

/** Query completa aceita por `GET /queue` — validada por `queueQuerySchema`. */
export interface QueueQuery extends QueueFilterQuery {
  page: number;
  pageSize: number;
}

export interface QueueAssignee {
  id: string;
  name: string;
}

export interface QueueItem extends RequestSummary {
  requesterEmail: string;
  assigneeId: string | null;
}

export interface QueueResponse extends PaginatedResponse<QueueItem> {
  assignees: QueueAssignee[];
}
