import {
  rebuildDuplicateIndex,
  resetDuplicateIndex,
  startDuplicateIndexPolling,
} from "./indexLifecycle.ts";
import { isDuplicateDetectionEnabled } from "./duplicates.repository.ts";

/**
 * Bootstrap do índice de duplicidade no boot do servidor (issue #209).
 *
 * Roda depois do `app.listen`, sem bloquear a subida. Flag desligada limpa o
 * índice e não o constrói; falha de build não derruba o servidor — o endpoint
 * degrada para vazio até o próximo rebuild/poll.
 */
export async function bootstrapDuplicateIndex(): Promise<void> {
  try {
    if (await isDuplicateDetectionEnabled()) {
      await rebuildDuplicateIndex();
    } else {
      resetDuplicateIndex();
    }
  } catch {
    console.warn("[duplicates] index bootstrap failed");
  } finally {
    startDuplicateIndexPolling();
  }
}
