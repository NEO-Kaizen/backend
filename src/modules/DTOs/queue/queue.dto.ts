import type { RequestPriority, RequestStatus } from "../../../shared/types/requests.ts";

/**
 * Parâmetros aceitos pela persistência da fila (camada de infraestrutura).
 * A validação/contrato público fica no `queueQuerySchema` (queue.schemas.ts).
 */
export interface FindQueueParams {
  search?: string;
  status?: RequestStatus;
  priority?: RequestPriority;
  assigneeId?: string;
  unassigned?: boolean;
  limit: number;
  offset: number;
}
