import type { DemandBlock } from "../../../shared/types/requests.ts";

/** Contrato HTTP do Alerta de duplicidade (issue #209). */
export interface DuplicateCheckPayload {
  demand: DemandBlock;
}
