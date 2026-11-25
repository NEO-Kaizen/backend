import type { SimilarityDocument } from "../../shared/types/duplicates.ts";

/**
 * Poller incremental do índice de duplicidade (issue #209).
 *
 * O banco é a fonte de verdade: o poller lê somente a projeção, a cada 30 s,
 * com sobreposição de 5 min em `updated_at` para cobrir commits atrasados. As
 * dependências são injetadas para permitir teste determinístico com fake
 * timers. Flag desligada limpa o índice e não constrói.
 */
export type IndexPollChange =
  | { publicId: string; published: true; document: SimilarityDocument }
  | { publicId: string; published: false };

export interface IndexPollerOptions {
  readEnabled: () => Promise<boolean>;
  readAll: () => Promise<readonly SimilarityDocument[]>;
  readChanges: (since: Date) => Promise<readonly IndexPollChange[]>;
  apply: (document: SimilarityDocument) => void;
  remove: (publicId: string) => void;
  clear: () => void;
  now?: () => Date;
  intervalMs?: number;
  overlapMs?: number;
  onError?: (error: unknown) => void;
}

export interface IndexPoller {
  runOnce: () => Promise<void>;
  start: () => void;
  stop: () => void;
}

export const DUPLICATE_INDEX_POLL_INTERVAL_MS = 30_000;
export const DUPLICATE_INDEX_OVERLAP_MS = 5 * 60_000;

export function createIndexPoller(options: IndexPollerOptions): IndexPoller {
  const intervalMs = options.intervalMs ?? DUPLICATE_INDEX_POLL_INTERVAL_MS;
  const overlapMs = options.overlapMs ?? DUPLICATE_INDEX_OVERLAP_MS;
  const now = options.now ?? (() => new Date());

  let cursor: Date | null = null;
  let enabledState: boolean | null = null;
  let running: Promise<void> | null = null;
  let timer: NodeJS.Timeout | null = null;

  async function sync(): Promise<void> {
    const enabled = await options.readEnabled();

    if (!enabled) {
      options.clear();
      cursor = null;
      enabledState = false;
      return;
    }

    const runAt = now();

    // Primeira execução (ou religação da flag): reconstrói a partir da
    // projeção publicada. Nas seguintes, aplica apenas as mudanças.
    if (enabledState !== true) {
      const documents = await options.readAll();
      options.clear();
      for (const document of documents) {
        options.apply(document);
      }
      cursor = runAt;
      enabledState = true;
      return;
    }

    const since = new Date((cursor ?? runAt).getTime() - overlapMs);
    const changes = await options.readChanges(since);

    for (const change of changes) {
      if (change.published) {
        options.apply(change.document);
      } else {
        options.remove(change.publicId);
      }
    }

    cursor = runAt;
  }

  async function runOnce(): Promise<void> {
    if (running) return running;

    running = (async () => {
      try {
        await sync();
      } catch (error) {
        // Falha de poll não derruba o servidor nem avança o cursor: a próxima
        // execução tenta de novo com a mesma janela.
        options.onError?.(error);
      } finally {
        running = null;
      }
    })();

    return running;
  }

  function start(): void {
    if (timer) return;

    timer = setInterval(() => {
      void runOnce();
    }, intervalMs);

    // Não segura o event loop sozinho (o servidor HTTP já o mantém).
    if (typeof timer.unref === "function") timer.unref();
  }

  function stop(): void {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  return { runOnce, start, stop };
}
