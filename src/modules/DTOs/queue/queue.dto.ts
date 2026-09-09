export interface GetQueueQuery {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  unassigned?: boolean;
  page: number;
  pageSize: number;
}