import type { SimilarityDocument, SimilarityHit } from "../../shared/types/duplicates.ts";
import { sweepCompletedWindow } from "./completedWindowSweep.ts";
import {
  isDuplicateDetectionEnabled,
  isPublishedProjection,
  listProjectionChangesSince,
  listPublishedProjections,
  type PublicProjectionRow,
} from "./duplicates.repository.ts";
import { createIndexPoller, type IndexPoller } from "./indexPoller.ts";
import { MiniSearchIndex } from "./miniSearchIndex.ts";
import type { SimilarityIndex } from "./similarityIndex.ts";

/**
 * Ciclo de vida do índice de duplicidade (issue #209).
 *
 * O índice é derivado e reconstruível a partir de
 * `request_public_projections`. O build roda fora do caminho da requisição;
 * enquanto não estiver pronto, a busca degrada para vazio. O poll de 30 s
 * mantém a defasagem conhecida (30–60 s) e a flag desligada limpa o índice.
 */
const index: SimilarityIndex = new MiniSearchIndex();

let ready = false;
let poller: IndexPoller | null = null;

function toSimilarityDocument(row: PublicProjectionRow): SimilarityDocument {
  return {
    publicId: row.public_id,
    title: row.public_title,
    summary: row.public_summary,
    category: row.public_category,
    status: row.public_status,
    period: row.public_period,
  };
}

/** Limpa o índice e o marca como não pronto (flag desligada, testes, reset). */
export function resetDuplicateIndex(): void {
  index.rebuild([]);
  ready = false;
}

/**
 * Reconstrói o índice inteiro a partir da projeção publicada. Deve ser
 * chamado no boot (não bloqueante) e explicitamente pelos testes `db`, que
 * sobem apenas o `app.ts`.
 */
export async function rebuildDuplicateIndex(): Promise<void> {
  try {
    const enabled = await isDuplicateDetectionEnabled();

    if (!enabled) {
      resetDuplicateIndex();
      return;
    }

    // A varredura roda também no rebuild para que a janela seja aplicada mesmo
    // que o poll não tenha passado desde a última mudança de configuração.
    await sweepCompletedWindow();

    const projections = await listPublishedProjections();
    index.rebuild(projections.map(toSimilarityDocument));
    ready = true;
  } catch {
    // O servidor continua no ar; até o próximo rebuild/poll o endpoint
    // responde vazio. Nenhum texto de consulta é logado.
    ready = false;
    console.warn("[duplicates] index rebuild failed");
  }
}

/** Busca no índice; vazio quando ele não está pronto ou o motor falha. */
export function searchDuplicateIndex(query: string, limit: number): SimilarityHit[] {
  if (!ready) return [];

  try {
    return index.search(query, limit);
  } catch {
    return [];
  }
}

/** Inicia o poll incremental; idempotente. */
export function startDuplicateIndexPolling(): void {
  if (poller) return;

  poller = createIndexPoller({
    readEnabled: isDuplicateDetectionEnabled,
    sweepCompletedWindow,
    readAll: async () => {
      const projections = await listPublishedProjections();
      return projections.map(toSimilarityDocument);
    },
    readChanges: async (since) => {
      const changes = await listProjectionChangesSince(since);
      return changes.map((change) =>
        isPublishedProjection(change)
          ? {
              publicId: change.public_id,
              published: true,
              document: toSimilarityDocument(change),
            }
          : { publicId: change.public_id, published: false },
      );
    },
    apply: (document) => {
      index.upsert(document);
    },
    remove: (publicId) => {
      index.remove(publicId);
    },
    clear: () => {
      index.rebuild([]);
      ready = false;
    },
    onSuccess: () => {
      ready = true;
    },
    onError: () => {
      // Falha de poll degrada a busca para vazio até o próximo sucesso; o
      // índice antigo não pode continuar respondendo (issue #209).
      ready = false;
      console.warn("[duplicates] index poll failed");
    },
    // O boot já reconstruiu o índice quando a flag está ligada; a primeira
    // volta do poller pode ser incremental.
    initialized: ready,
  });

  poller.start();
}
