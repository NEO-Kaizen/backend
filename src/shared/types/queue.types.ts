import type { RequestPriority, RequestStatus } from './requests.ts';
import type { RequestSummary } from '../../modules/DTOs/requests/RequestResponse.dto.ts';
import type {PaginatedResponse} from './pagination.ts';
export interface QueueMetricsResponse {
  totalRequests: number;
  unassignedRequests: number;
  inProgressRequests: number;
  overdueRequests: number;
}

export interface PaginationQuery {
  page: number;
  pageSize: number;
}

export interface QueueFilterQuery {
  search?: string;
  status?: RequestStatus;
  priority?: RequestPriority;
  assigneeId?: number | 'unassigned';
  unassigned?: boolean;
}

export type QueueQuery = PaginationQuery & QueueFilterQuery;

export interface QueueAssignee {
  id: number;
  name: string;
}

export interface QueueItem extends RequestSummary {
  requesterEmail: string;
  assigneeId: number | null;
}

export interface QueueResponse extends PaginatedResponse<QueueItem> {
  assignees: QueueAssignee[];
}
