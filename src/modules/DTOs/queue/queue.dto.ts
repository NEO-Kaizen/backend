import type { RequestPriority, RequestStatus } from '../../../shared/types/requests.ts';

export interface GetQueueQuery {
  search?: string;
  status?: RequestStatus;
  priority?: RequestPriority;
  assigneeId?: number | 'unassigned';
  unassigned?: boolean;
  page: number;
  pageSize: number;
}

export interface FindQueueParams {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  unassigned?: boolean;
  limit: number;
  offset: number;
}