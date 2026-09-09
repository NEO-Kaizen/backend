import { findQueueRequests } from './queue.repository.ts';
import type {GetQueueQuery} from '../DTOs/queue/queue.dto.ts';

export const listQueueService = async (filters: GetQueueQuery) => {
  const { page, pageSize, search, status, priority, assigneeId, unassigned } = filters;
  const offset = (page - 1) * pageSize;

  const { items, total } = await findQueueRequests({
    search,
    status,
    priority,
    assigneeId,
    unassigned,
    limit: pageSize,
    offset,
  });

  const totalPages = Math.ceil(total / pageSize);

  const formattedData = items.map((item) => ({
    protocolo: item.protocol,
    dataDeEntrada: item.createdAt,
    processo: item.processName,
    prioridade: item.priority,
    status: item.status,
    responsavel: item.assigneeName  ? item.assigneeName : null,
    solicitanteEmail: item.requesterEmail,
  }));

  return {
    data: formattedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
};