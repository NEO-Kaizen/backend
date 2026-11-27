import type { QueueFilterQuery, QueueSortQuery } from "../../../shared/types/queue.types.ts";

/**
 * Parâmetros aceitos pela persistência da fila (camada de infraestrutura).
 * A validação/contrato público fica no `queueQuerySchema` (queue.schemas.ts).
 */
export interface FindQueueParams extends QueueFilterQuery, QueueSortQuery {
  /**
   * Escopo de visibilidade por usuário (issue #102). Quando definido, restringe
   * o resultado às solicitações em que o usuário é responsável — de triagem ou
   * de mapeamento. `undefined` = sem restrição (perfis Gestor/Administrador).
   */
  scopedUserId?: number;
  /**
   * Custódia de `internal_note:read` aplicada somente à correspondência em
   * notas. `undefined` = sem restrição (Gestor/Administrador e exportação CSV).
   */
  noteCustodianUserId?: number;
  limit: number;
  offset: number;
}
