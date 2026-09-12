import type { RequestPriority, RequestStatus } from './requests.ts';
import type { RequestSummary, PaginatedResponse } from '../../modules/DTOs/requests/RequestResponse.dto.ts';

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

export interface QueueItem extends RequestSummary {
  requesterEmail: string;
}

export type QueueResponse = PaginatedResponse<QueueItem>;
