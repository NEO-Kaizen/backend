import { findQueueRequests } from './queue.repository.ts';
import type { PaginatedResponse } from '../DTOs/requests/RequestResponse.dto.ts';
import type { QueueQuery, QueueResponse } from '../../shared/types/queue.types.ts';


export const listQueueService = async (filters: QueueQuery): Promise<QueueResponse> => {
  const { page, pageSize, search, status, priority, assigneeId, unassigned } = filters;
  const offset = (page - 1) * pageSize;

  const { items, total } = await findQueueRequests({
    search,
    status,
    priority,
    assigneeId: assigneeId === 'unassigned' ? undefined : String(assigneeId ?? undefined),
    unassigned,
    limit: pageSize,
    offset,
  });

  const totalPages = Math.ceil(total / pageSize);

  const formattedData = items.map((item) => ({
    protocolo: item.protocol,
    dataDeEntrada: String(item.createdAt),
    processo: item.processName,
    prioridade: item.priority,
    status: item.status,
    responsavel: item.assignee ? item.assignee : null,
    solicitanteEmail: item.requesterEmail,
  }));

  const effectivePage = page > totalPages ? 1 : page;

  const response: PaginatedResponse<typeof formattedData[number]> = {
    data: formattedData,
    page: effectivePage,
    pageSize,
    total,
    totalPages,
  };

  return response as unknown as QueueResponse;
};