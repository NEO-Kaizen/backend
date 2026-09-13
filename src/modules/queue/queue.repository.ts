import db from '../../database/conection.ts';
import type { FindQueueParams } from '../DTOs/queue/queue.dto.ts';
import type { QueueItem, QueueMetricsResponse } from '../../shared/types/queue.types.ts';

const IN_PROGRESS_STATUSES = [
  'Em triagem',
  'Em mapeamento',
  'Em análise de viabilidade',
  'Em desenvolvimento',
  'Em homologação',
];

export const fetchQueueMetrics = async(): Promise<QueueMetricsResponse> => {
  const result = await db('requests')
    .leftJoin('statuses as s', 's.status_id', 'requests.status_id')
    .select(
      db.raw('COUNT(requests.*)::int as "totalRequests"'),
      db.raw('COUNT(CASE WHEN requests.professional_id IS NULL THEN 1 END)::int as "unassignedRequests"'),
      db.raw(
        `COUNT(CASE WHEN s.name IN (${IN_PROGRESS_STATUSES.map(() => '?').join(',')}) THEN 1 END)::int as "inProgressRequests"`,
        IN_PROGRESS_STATUSES
      ),
      // Regra de atrasados: desired_deadline expirado e status não final
      db.raw(
        `COUNT(CASE WHEN requests.desired_deadline < NOW() AND s.name NOT IN ('Concluído', 'Cancelado') THEN 1 END)::int as "overdueRequests"`
      )
    )
    .first();

  return {
    totalRequests: result?.totalRequests || 0,
    unassignedRequests: result?.unassignedRequests || 0,
    inProgressRequests: result?.inProgressRequests || 0,
    overdueRequests: result?.overdueRequests || 0,
  };
};

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

export const fetchAllAssignees = async (): Promise<{ id: number; name: string }[]> => {
  const rows = await db('professionals')
    .select('professional_id as id', 'full_name as name')
    .orderBy('full_name', 'asc');

  return rows;
};