import db from '../../database/conection.ts';

interface FindQueueParams {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  unassigned?: boolean;
  limit: number;
  offset: number;
}

export const findQueueRequests = async (params: FindQueueParams) => {
  const { search, status, priority, assigneeId, unassigned, limit, offset } = params;

  const baseQuery = db('requests')
    .join('users as requester', 'requests.requester_id', 'requester.id')
    .leftJoin('users as assignee', 'requests.assignee_id', 'assignee.id');

  if (search) {
    baseQuery.andWhere((builder) => {
      builder
        .where('requests.protocol', 'ilike', `%${search}%`)
        .orWhere('requester.email', 'ilike', `%${search}%`);
    });
  }

  if (status) baseQuery.andWhere('requests.status', status);
  if (priority) baseQuery.andWhere('requests.priority', priority);

  if (unassigned) {
    baseQuery.whereNull('requests.assignee_id');
  } else if (assigneeId) {
    baseQuery.andWhere('requests.assignee_id', assigneeId);
  }

  const countQuery = baseQuery.clone().count('* as total').first();

  const itemsQuery = baseQuery
    .select(
      'requests.protocol',
      'requests.created_at as createdAt',
      'requests.process_name as processName',
      'requests.priority',
      'requests.status',
      'assignee.id as assigneeId',
      'assignee.name as assigneeName',
      'requester.name as requesterName',
      'requester.email as requesterEmail'
    )
    .orderBy('requests.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const [countResult, items] = await Promise.all([countQuery, itemsQuery]);
  const total = countResult ? Number(countResult.total) : 0;

  return { items, total };
};