import db from "../../database/conection.ts";
import {
  getDuplicateCompletedWindowMonths,
  listSuppressedCompletedWithinWindow,
  suppressCompletedOutsideWindow,
} from "./duplicates.repository.ts";
import { publishRequestProjection } from "./projection.ts";

/**
 * Reconciliação da janela de conclusão nos dois sentidos (issue #210).
 *
 * 1. Publicadas fora da janela viram `suppressed`/`outside_window`.
 * 2. Suprimidas por `outside_window` que voltaram para dentro da janela são
 *    republicadas por `publishRequestProjection`, que relê `requests` e
 *    reavalia restrição, Categoria, Status, `concluded_at` e o gate de PII.
 *    Não basta flipar `publication_status`: a linha suprimida guarda template
 *    e o texto tarjado precisa ser regenerado.
 *
 * A republicação roda em lotes de `SWEEP_BATCH_SIZE`, com uma transação por
 * lote; a janela é lida uma vez e reaproveitada nas publicações.
 *
 * Roda antes do rebuild do índice e de cada poll.
 */
export const SWEEP_BATCH_SIZE = 50;

export async function sweepCompletedWindow(): Promise<void> {
  const windowMonths = await getDuplicateCompletedWindowMonths();
  await suppressCompletedOutsideWindow(windowMonths);

  const candidates = await listSuppressedCompletedWithinWindow(windowMonths);

  for (let start = 0; start < candidates.length; start += SWEEP_BATCH_SIZE) {
    const batch = candidates.slice(start, start + SWEEP_BATCH_SIZE);

    await db.transaction(async (trx) => {
      for (const requestId of batch) {
        await publishRequestProjection(trx, requestId, windowMonths);
      }
    });
  }
}
