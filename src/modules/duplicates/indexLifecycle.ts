import type { SimilarityDocument, SimilarityHit } from "../../shared/types/duplicates.ts";
import * as repository from "./duplicates.repository.ts";
import { createIndexPoller, type IndexPoller } from "./indexPoller.ts";
import { MiniSearchIndex } from "./miniSearchIndex.ts";
import type { PublicProjectionRow } from "./duplicates.repository.ts";
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
    const enabled = await repository.isDuplicateDetectionEnabled();

    if (!enabled) {
      resetDuplicateIndex();
      return;
    }

    const projections = await repository.listPublishedProjections();
    index.rebuild(projections.map(toSimilarityDocument));
    ready = true;
  } catch {
    // O servidor continua no ar; até o próximo rebuild/poll o endpoint
    // responde vazio. Nenhum texto de consulta é logado.
    ready = false;
    console.warn("[duplicates] index rebuild failed");
  }
}

/**
 * Aplica um lote incremental de mudanças da projeção. A janela é de
 * responsabilidade do chamador; o poller usa a sobreposição de 5 min.
 */
export async function syncDuplicateIndex(since: Date): Promise<void> {
  try {
    const enabled = await repository.isDuplicateDetectionEnabled();

    if (!enabled) {
      resetDuplicateIndex();
      return;
    }

    if (!ready) {
      await rebuildDuplicateIndex();
      return;
    }

    const changes = await repository.listProjectionChangesSince(since);

    for (const change of changes) {
      if (change.publication_status === "published" && change.is_publicly_listable) {
        index.upsert(toSimilarityDocument(change));
      } else {
        index.remove(change.public_id);
      }
    }
  } catch {
    ready = false;
    console.warn("[duplicates] index sync failed");
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
    readEnabled: repository.isDuplicateDetectionEnabled,
    readAll: async () => {
      const projections = await repository.listPublishedProjections();
      return projections.map(toSimilarityDocument);
    },
    readChanges: async (since) => {
      const changes = await repository.listProjectionChangesSince(since);
      return changes.map((change) =>
        change.publication_status === "published" && change.is_publicly_listable
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
      ready = true;
    },
    remove: (publicId) => {
      index.remove(publicId);
    },
    clear: () => {
      index.rebuild([]);
      ready = false;
    },
    onError: () => {
      console.warn("[duplicates] index poll failed");
    },
    // O boot já reconstruiu o índice quando a flag está ligada; a primeira
    // volta do poller pode ser incremental.
    initialized: ready,
  });

  poller.start();
}

export function stopDuplicateIndexPolling(): void {
  poller?.stop();
  poller = null;
}
