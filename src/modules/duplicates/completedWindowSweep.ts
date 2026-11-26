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
 * Roda antes do rebuild do índice e de cada poll.
 */
export async function sweepCompletedWindow(): Promise<void> {
  const windowMonths = await getDuplicateCompletedWindowMonths();
  await suppressCompletedOutsideWindow(windowMonths);

  const candidates = await listSuppressedCompletedWithinWindow(windowMonths);

  for (const requestId of candidates) {
    await db.transaction(async (trx) => {
      await publishRequestProjection(trx, requestId);
    });
  }
}
