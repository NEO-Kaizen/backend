import type { Knex } from "knex";
import { STATUS_IDS } from "../../shared/types/status.ts";

/**
 * `requests.concluded_at` acompanha o Status (issue #210): entra no Status 16
 * com o relógio do banco e é limpo ao sair. A data é a única fonte da janela
 * do corpus de duplicidade; `updated_at` nunca é usado como fallback.
 *
 * Use sempre na MESMA transação da mudança de Status, antes de
 * `publishRequestProjection`.
 */
export function concludedAtUpdate(db: Knex, statusId: number): { concluded_at: Knex.Raw | null } {
  return {
    concluded_at: statusId === STATUS_IDS.completed ? db.fn.now() : null,
  };
}
