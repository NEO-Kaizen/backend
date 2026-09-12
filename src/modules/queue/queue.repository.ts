import db from '../../database/conection.ts';
import type { FindQueueParams } from '../DTOs/queue/queue.dto.ts';
import type { QueueItem } from '../../shared/types/queue.types.ts';


export const findQueueRequests = async (params: FindQueueParams): Promise<{ items: QueueItem[]; total: number }> => {
  const { search, status, priority, assigneeId, unassigned, limit, offset } = params;

  const baseQuery = db('requests')
    .join('requesters as requester', 'requester.requester_id', 'requests.requester_id')
    .join('statuses as status', 'status.status_id', 'requests.status_id')
    .leftJoin('priorities as priority_tbl', 'priority_tbl.priority_id', 'requests.priority_id')
    .leftJoin('professionals as assignee', 'assignee.professional_id', 'requests.professional_id');

  if (search) {
    baseQuery.andWhere((builder) => {
      builder
        .where('requests.protocol', 'ilike', `%${search}%`)
        .orWhere('requester.corporate_email', 'ilike', `%${search}%`)
        .orWhere('requester.full_name', 'ilike', `%${search}%`);
    });
  }

  if (status) baseQuery.andWhere('status.name', status);
  if (priority) baseQuery.andWhere('priority_tbl.level', priority);

  if (unassigned) {
    baseQuery.whereNull('requests.professional_id');
  } else if (assigneeId) {
    baseQuery.andWhere('requests.professional_id', assigneeId);
  }

  const countQuery = baseQuery.clone().count('* as total').first();

  const itemsQuery = baseQuery
    .select(
      'requests.protocol',
      'requests.created_at as createdAt',
      'requests.process_name as processName',
      'priority_tbl.level as priority',
      'status.name as status',
      'assignee.professional_id as assigneeId',
      'assignee.full_name as assignee',
      'requester.full_name as requesterName',
      'requester.corporate_email as requesterEmail'
    )
    .orderBy('requests.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const [countResult, items] = await Promise.all([countQuery, itemsQuery]);
  const total = countResult ? Number((countResult).total) : 0;

  return { items, total };
};