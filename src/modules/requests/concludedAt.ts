import type { Knex } from "knex";
import { isCompletedStatus, STATUS_IDS } from "../../shared/types/status.ts";

/**
 * `requests.concluded_at` acompanha o Status (issue #210): entrar no Status 16
 * grava o relógio do banco, permanecer nele preserva a data (inclusive
 * preenchendo um legado nulo) e sair limpa. A data é a única fonte da janela
 * do corpus de duplicidade; `updated_at` nunca é usado como fallback.
 *
 * O `CASE` é avaliado contra a linha antiga: `status_id` ainda é o Status
 * anterior mesmo com `status_id` no mesmo `SET`.
 *
 * Use sempre na MESMA transação da mudança de Status, antes de
 * `publishRequestProjection`.
 */
export function buildConcludedAtUpdate(
  trx: Knex.Transaction,
  statusId: number,
): { concluded_at: Knex.Raw | null } {
  return {
    concluded_at: isCompletedStatus(statusId)
      ? trx.raw("CASE WHEN status_id = ? THEN COALESCE(concluded_at, now()) ELSE now() END", [
          STATUS_IDS.completed,
        ])
      : null,
  };
}
