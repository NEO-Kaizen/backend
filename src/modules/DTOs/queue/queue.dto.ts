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
  /**
   * Escopo de visibilidade por usuário (issue #102). Quando definido, restringe
   * o resultado às solicitações em que o usuário é responsável — de triagem ou
   * de mapeamento. `undefined` = sem restrição (perfis Gestor/Administrador).
   */
  scopedUserId?: number;
  limit: number;
  offset: number;
}
