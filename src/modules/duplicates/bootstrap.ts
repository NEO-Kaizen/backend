import { rebuildDuplicateIndex, startDuplicateIndexPolling } from "./indexLifecycle.ts";

/**
 * Bootstrap do índice de duplicidade no boot do servidor (issue #209).
 *
 * Roda depois do `app.listen`, sem bloquear a subida. `rebuildDuplicateIndex`
 * já trata a flag desligada (limpa o índice e não constrói); falha de build não
 * derruba o servidor — o endpoint degrada para vazio até o próximo rebuild/poll.
 */
export async function bootstrapDuplicateIndex(): Promise<void> {
  try {
    await rebuildDuplicateIndex();
  } catch {
    console.warn("[duplicates] index bootstrap failed");
  } finally {
    startDuplicateIndexPolling();
  }
}
