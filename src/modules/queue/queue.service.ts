import { findQueueRequests, fetchQueueMetrics, fetchAllAssignees } from './queue.repository.ts';
import type { QueueQuery, QueueResponse, QueueMetricsResponse } from '../../shared/types/queue.types.ts';

export const getQueueMetricsService = async () : Promise<QueueMetricsResponse> => {
  return await fetchQueueMetrics();
}

export const listQueueService = async (filters: QueueQuery): Promise<QueueResponse> => {
  const { page, pageSize, search, status, priority, assigneeId, unassigned } = filters;
  const offset = (page - 1) * pageSize;

  const repoAssigneeId = typeof assigneeId === 'number' ? String(assigneeId) : undefined;

  const [{ items, total }, assignees] = await Promise.all([
    findQueueRequests({
      search,
      status,
      priority,
      assigneeId: repoAssigneeId,
      unassigned,
      limit: pageSize,
      offset,
    }),
    fetchAllAssignees(),
  ]);

  const totalPages = Math.ceil(total / pageSize) || 0;

  const formattedData = items.map((item) => ({
    protocol: item.protocol,
    createdAt: String(item.createdAt),
    processName: item.processName,
    priority: item.priority,
    status: item.status,
    assignee: item.assignee ?? null,
    requesterName: item.requesterName,
    requesterEmail: item.requesterEmail,
    assigneeId: item.assigneeId ?? null,
  }));

  const effectivePage = page > totalPages && totalPages > 0 ? totalPages : page;

  const response: QueueResponse = {
    data: formattedData,
    page: effectivePage,
    pageSize,
    total,
    totalPages,
    assignees: assignees.map((a) => ({ id: Number(a.id), name: String(a.name) })),
  };

  return response;
};