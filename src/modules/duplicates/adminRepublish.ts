import type { Knex } from "knex";
import { warnDuplicateCompletedWindowFallback } from "./completedWindow.ts";
import {
  getDuplicateCompletedWindow,
  listRequestIdsByCategoryIds,
  listRequestIdsByStatusIds,
} from "./duplicates.repository.ts";
import { publishRequestProjection } from "./projection.ts";

/**
 * Reavaliação das projeções afetadas pela edição administrativa das allowlists
 * (issue #212). `is_publicly_listable` é um snapshot na projeção: desligar uma
 * Categoria/Status precisa suprimir o que estava publicado, e religar precisa
 * republicar o que voltou a ser elegível.
 *
 * Roda DENTRO da transação do PATCH, usando `publishRequestProjection` — a mesma
 * função usada nos eventos da Solicitação — para não duplicar a precedência de
 * supressão, o gate de PII nem a janela. A janela é lida uma única vez por lote.
 * O custo é proporcional às Solicitações afetadas; as allowlists são escritas
 * raramente e por um Administrador, e a atomicidade vale mais que o N+1 aqui.
 */
async function republish(trx: Knex.Transaction, requestIds: readonly string[]): Promise<void> {
  if (requestIds.length === 0) return;

  const window = await getDuplicateCompletedWindow({
    trx,
    onFallback: warnDuplicateCompletedWindowFallback,
  });

  for (const requestId of requestIds) {
    await publishRequestProjection(trx, requestId, window);
  }
}

export async function republishProjectionsForCategories(
  trx: Knex.Transaction,
  categoryIds: readonly number[],
): Promise<void> {
  await republish(trx, await listRequestIdsByCategoryIds(trx, categoryIds));
}

export async function republishProjectionsForStatuses(
  trx: Knex.Transaction,
  statusIds: readonly number[],
): Promise<void> {
  await republish(trx, await listRequestIdsByStatusIds(trx, statusIds));
}
