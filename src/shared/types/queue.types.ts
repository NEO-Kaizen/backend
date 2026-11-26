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

/** Campos de ordenação permitidos pela API da fila (contrato RF04). */
export const QUEUE_SORT_BY = ["createdAt", "protocol", "status", "priority"] as const;
export type QueueSortBy = (typeof QUEUE_SORT_BY)[number];

/** Direções de ordenação permitidas pela API da fila (issue #215). */
export const QUEUE_SORT_ORDER = ["asc", "desc"] as const;
export type QueueSortOrder = (typeof QUEUE_SORT_ORDER)[number];

/** Filtros compartilhados pela fila paginada e pela exportação CSV. */
export interface QueueFilterQuery {
  search?: string;
  status?: RequestStatus;
  priority?: QueuePriorityFilter;
  assigneeId?: string | "unassigned";
  unassigned?: boolean;
  /** Data inicial de abertura (`AAAA-MM-DD`), inclusiva em UTC. */
  createdFrom?: string;
  /** Data final de abertura (`AAAA-MM-DD`), inclusiva em UTC. */
  createdTo?: string;
  /** Departamento do solicitante, comparado de forma exata e case-insensitive. */
  department?: string;
}

/** Ordenação aceita somente pela fila paginada; a exportação CSV não a usa. */
export interface QueueSortQuery {
  sortBy?: QueueSortBy;
  sortOrder?: QueueSortOrder;
}

/** Filtros + ordenação aceitos pela exportação CSV (sem paginação). */
export type QueueExportQuery = QueueFilterQuery & QueueSortQuery;

/** Query completa aceita por `GET /queue` — validada por `queueQuerySchema`. */
export interface QueueQuery extends QueueFilterQuery, QueueSortQuery {
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
  /** Departamentos distintos e globais do solicitante, ordenados. */
  departments: string[];
}
