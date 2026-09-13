import type { RequestStatus, RequestPriority } from '../../shared/types/requests.ts';

const statusValues = [
  'Solicitação enviada',
  'Aguardando triagem',
  'Em triagem',
  'Pendente de informações',
  'Aguardando mapeamento',
  'Mapeamento agendado',
  'Em mapeamento',
  'Em análise de viabilidade',
  'Elegível',
  'Não elegível',
  'Priorizado',
  'Backlog',
  'Direcionado para outra área',
  'Em desenvolvimento',
  'Em homologação',
  'Concluído',
  'Cancelado',
] as const;

const priorityValues = ['Baixa', 'Média', 'Alta', 'Crítica'] as const;

export type QueueQuerySchema = {
  search?: string;
  status?: RequestStatus;
  priority?: RequestPriority;
  assigneeId?: string | 'unassigned';
  unassigned?: boolean;
  page: number;
  pageSize: number;
};
// `QueueMetricsResponse` is defined in `shared/types/queue.types.ts` — avoid duplicate definition here.

function isValidStatus(s: unknown): s is RequestStatus {
  return typeof s === 'string' && (statusValues as readonly string[]).includes(s);
}

function isValidPriority(p: unknown): p is RequestPriority {
  return typeof p === 'string' && (priorityValues as readonly string[]).includes(p);
}

export function validateQueueQuery(query: unknown): { success: true; data: QueueQuerySchema } | { success: false; errors: string[] } {
  const errors: string[] = [];
  const q = query && typeof query === 'object' ? (query as Record<string, unknown>) : {};

  const page = q.page !== undefined ? Number(q.page) : undefined;
  const pageSize = q.pageSize !== undefined ? Number(q.pageSize) : undefined;

  if (!page || Number.isNaN(page) || page < 1) {
    errors.push('Invalid or missing "page" (must be integer >= 1)');
  }
  if (!pageSize || Number.isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    errors.push('Invalid or missing "pageSize" (must be 1..100)');
  }

  const search = q.search !== undefined && q.search !== null ? String(q.search) : undefined;

  const statusRaw = q.status !== undefined && q.status !== null ? String(q.status) : undefined;
  const status = statusRaw && isValidStatus(statusRaw) ? statusRaw : undefined;
  if (statusRaw !== undefined && status === undefined) errors.push('Invalid "status"');

  const priorityRaw = q.priority !== undefined && q.priority !== null ? String(q.priority) : undefined;
  const priority = priorityRaw && isValidPriority(priorityRaw) ? priorityRaw : undefined;
  if (priorityRaw !== undefined && priority === undefined) errors.push('Invalid "priority"');

  let assigneeId: string | 'unassigned' | undefined = undefined;
  if (q.assigneeId !== undefined && q.assigneeId !== null) {
    const s = String(q.assigneeId).trim();
    if (s === 'unassigned') assigneeId = 'unassigned';
    else {
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const numericRegex = /^\d+$/;
      if (uuidRegex.test(s) || numericRegex.test(s)) {
        assigneeId = s;
      } else {
        errors.push('Invalid "assigneeId"');
      }
    }
  }

  const unassigned = q.unassigned === 'true' || q.unassigned === true;

  if (errors.length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      search,
      status,
      priority,
      assigneeId,
      unassigned,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  };
}

export default validateQueueQuery;