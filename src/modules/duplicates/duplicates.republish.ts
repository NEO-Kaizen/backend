import type { Knex } from "knex";
import { warnDuplicateCompletedWindowFallback } from "./completedWindow.ts";
import {
  findExistingProjectionsForUpdate,
  findProjectionSources,
  getDuplicateCompletedWindow,
  listRequestIdsForAllowlists,
  lockDuplicateSettings,
} from "./duplicates.repository.ts";
import { buildProjectionRow } from "./projection.ts";

/**
 * Reavaliação em lote das projeções afetadas pela edição administrativa das
 * allowlists (issue #212). `is_publicly_listable` é um snapshot na projeção:
 * desligar uma Categoria/Status suprime o que estava publicado e religar
 * republica o que voltou a ser elegível.
 *
 * Uma única consulta com `whereIn` busca as Solicitações afetadas (Categoria
 * OU Status), outra busca as fontes e outra as projeções existentes — sem N+1.
 * O upsert é feito em lotes de `REPUBLISH_BATCH_SIZE` para limitar o tamanho da
 * transação do PATCH. Tudo roda dentro da transação do PATCH, reaproveitando
 * `buildProjectionRow`: a precedência de supressão, o gate de PII e a janela
 * continuam tendo uma única implementação.
 */
export const REPUBLISH_BATCH_SIZE = 50;

export async function republishAffectedProjections(
  trx: Knex.Transaction,
  categoryIds: readonly number[],
  statusIds: readonly number[],
): Promise<void> {
  await lockDuplicateSettings(trx);

  const requestIds = await listRequestIdsForAllowlists(trx, categoryIds, statusIds);
  if (requestIds.length === 0) return;

  const completedWindow = await getDuplicateCompletedWindow({
    trx,
    onFallback: warnDuplicateCompletedWindowFallback,
  });

  for (let start = 0; start < requestIds.length; start += REPUBLISH_BATCH_SIZE) {
    const batch = requestIds.slice(start, start + REPUBLISH_BATCH_SIZE);
    const [sources, existing] = await Promise.all([
      findProjectionSources(trx, batch, completedWindow),
      findExistingProjectionsForUpdate(trx, batch),
    ]);

    const rows = sources.map((source) =>
      buildProjectionRow(trx, source, existing.get(source.request_id)),
    );
    if (rows.length === 0) continue;

    await trx("request_public_projections").insert(rows).onConflict("request_id").merge();
  }
}
