import { afterEach, describe, expect, it, vi } from "vitest";
import type { SimilarityDocument } from "../../src/shared/types/duplicates.ts";
import {
  createIndexPoller,
  DUPLICATE_INDEX_POLL_INTERVAL_MS,
  type IndexPollChange,
} from "../../src/modules/duplicates/indexPoller.ts";
import { MiniSearchIndex } from "../../src/modules/duplicates/miniSearchIndex.ts";
import { DUPLICATE_SEARCH_LIMIT } from "../../src/modules/duplicates/similarityIndex.ts";

function document(publicId: string, title = "Solicitação de Automação em andamento") {
  return {
    publicId,
    title,
    summary: "Solicitação em andamento da categoria Automação, registrada no período 2026-Q4.",
    category: "Automação",
    status: "Em andamento",
    period: "2026-Q4",
  } satisfies SimilarityDocument;
}

function createDeps(overrides: {
  enabled?: boolean;
  documents?: SimilarityDocument[];
  changes?: IndexPollChange[];
  readChanges?: (since: Date) => Promise<readonly IndexPollChange[]>;
  expire?: () => Promise<void>;
}) {
  const apply = vi.fn();
  const remove = vi.fn();
  const clear = vi.fn();
  const readAll = vi.fn(async () => overrides.documents ?? []);
  const readChanges = vi.fn(overrides.readChanges ?? (async () => overrides.changes ?? []));
  const expire = vi.fn(overrides.expire ?? (async () => undefined));

  return {
    apply,
    remove,
    clear,
    readAll,
    readChanges,
    expire,
    options: {
      readEnabled: vi.fn(async () => overrides.enabled ?? true),
      expire,
      readAll,
      readChanges,
      apply,
      remove,
      clear,
      now: () => new Date("2026-11-25T12:00:00.000Z"),
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("poller do índice de duplicidade", () => {
  it("primeira execução reconstrói o índice a partir da projeção publicada", async () => {
    const deps = createDeps({ documents: [document("a"), document("b")] });
    const poller = createIndexPoller(deps.options);

    await poller.runOnce();

    expect(deps.clear).toHaveBeenCalledOnce();
    expect(deps.apply).toHaveBeenCalledTimes(2);
    expect(deps.apply).toHaveBeenCalledWith(expect.objectContaining({ publicId: "a" }));
  });

  it("aplica upsert e remoção por supressão nas mudanças incrementais", async () => {
    const deps = createDeps({
      documents: [document("a"), document("b")],
      changes: [
        { publicId: "a", published: true, document: document("a", "Novo título") },
        { publicId: "b", published: false },
      ],
    });
    const poller = createIndexPoller(deps.options);

    await poller.runOnce();
    deps.apply.mockClear();
    deps.remove.mockClear();

    await poller.runOnce();

    expect(deps.apply).toHaveBeenCalledWith(expect.objectContaining({ publicId: "a" }));
    expect(deps.remove).toHaveBeenCalledWith("b");
  });

  it("usa sobreposição de 5 minutos em updated_at", async () => {
    const deps = createDeps({ documents: [document("a")] });
    const poller = createIndexPoller(deps.options);

    await poller.runOnce();
    await poller.runOnce();

    const firstRun = new Date("2026-11-25T12:00:00.000Z").getTime();
    expect(deps.readChanges).toHaveBeenCalledWith(new Date(firstRun - 5 * 60_000));
  });

  it("falha de poll é reportada e o próximo tick tenta de novo sem avançar o cursor", async () => {
    const onError = vi.fn();
    let failing = true;
    const deps = createDeps({
      documents: [document("a")],
      readChanges: async () => {
        if (failing) {
          failing = false;
          throw new Error("falha transitória");
        }
        return [];
      },
    });
    const poller = createIndexPoller({ ...deps.options, onError });

    await poller.runOnce();
    await poller.runOnce();
    await poller.runOnce();

    expect(onError).toHaveBeenCalledOnce();
    expect(deps.readChanges).toHaveBeenCalledTimes(2);
    expect(deps.readChanges.mock.calls[0]?.[0]).toEqual(deps.readChanges.mock.calls[1]?.[0]);
  });

  it("flag desligada limpa o índice e não lê a projeção", async () => {
    const deps = createDeps({ enabled: false, documents: [document("a")] });
    const poller = createIndexPoller(deps.options);

    await poller.runOnce();

    expect(deps.clear).toHaveBeenCalledOnce();
    expect(deps.expire).not.toHaveBeenCalled();
    expect(deps.readAll).not.toHaveBeenCalled();
    expect(deps.readChanges).not.toHaveBeenCalled();
  });

  it("executa a varredura de expiração antes de ler mudanças", async () => {
    const order: string[] = [];
    const deps = createDeps({
      expire: async () => {
        order.push("expire");
      },
      readChanges: async () => {
        order.push("readChanges");
        return [];
      },
    });
    const poller = createIndexPoller({ ...deps.options, initialized: true });

    await poller.runOnce();

    expect(order).toEqual(["expire", "readChanges"]);
  });

  it("falha na varredura de expiração é reportada e não lê mudanças", async () => {
    const onError = vi.fn();
    const deps = createDeps({
      expire: async () => {
        throw new Error("falha na varredura");
      },
    });
    const poller = createIndexPoller({ ...deps.options, initialized: true, onError });

    await poller.runOnce();

    expect(onError).toHaveBeenCalledOnce();
    expect(deps.readAll).not.toHaveBeenCalled();
    expect(deps.readChanges).not.toHaveBeenCalled();
  });

  it("religa a construção quando a flag volta a ficar ligada", async () => {
    let enabled = false;
    const deps = createDeps({ documents: [document("a")] });
    const poller = createIndexPoller({
      ...deps.options,
      readEnabled: async () => enabled,
    });

    await poller.runOnce();
    enabled = true;
    await poller.runOnce();

    expect(deps.readAll).toHaveBeenCalledOnce();
    expect(deps.apply).toHaveBeenCalledWith(expect.objectContaining({ publicId: "a" }));
  });

  it("com índice já construído no boot, a primeira execução é incremental", async () => {
    const deps = createDeps({ changes: [] });
    const poller = createIndexPoller({ ...deps.options, initialized: true });

    await poller.runOnce();

    expect(deps.readAll).not.toHaveBeenCalled();
    expect(deps.readChanges).toHaveBeenCalledOnce();
  });

  it("integra o adaptador real: reconstrói e aplica mudanças novas sem falhar", async () => {
    const index = new MiniSearchIndex();
    const deps = createDeps({ documents: [document("a")] });
    const poller = createIndexPoller({
      ...deps.options,
      readAll: async () => [document("a")],
      readChanges: async () => [
        { publicId: "b", published: true, document: document("b", "Orçamento de viagem") },
      ],
      apply: (similarityDocument) => index.upsert(similarityDocument),
      remove: (publicId) => index.remove(publicId),
      clear: () => index.rebuild([]),
    });

    await poller.runOnce();
    expect(index.search("automacao", DUPLICATE_SEARCH_LIMIT)).toMatchObject([{ publicId: "a" }]);

    await poller.runOnce();
    expect(index.search("orcamento", DUPLICATE_SEARCH_LIMIT)).toMatchObject([{ publicId: "b" }]);
  });

  it("marca sucesso após o poll e não marca ao limpar por flag desligada", async () => {
    const onSuccess = vi.fn();
    const enabledDeps = createDeps({ documents: [document("a")] });
    const enabledPoller = createIndexPoller({ ...enabledDeps.options, onSuccess });

    await enabledPoller.runOnce();

    expect(onSuccess).toHaveBeenCalledOnce();

    const disabledOnSuccess = vi.fn();
    const disabledDeps = createDeps({ enabled: false });
    const disabledPoller = createIndexPoller({
      ...disabledDeps.options,
      onSuccess: disabledOnSuccess,
    });

    await disabledPoller.runOnce();

    expect(disabledOnSuccess).not.toHaveBeenCalled();
  });

  it("dispara o poll no intervalo configurado com fake timers", async () => {
    vi.useFakeTimers();
    const deps = createDeps({ documents: [document("a")] });
    const poller = createIndexPoller(deps.options);

    poller.start();
    await vi.advanceTimersByTimeAsync(DUPLICATE_INDEX_POLL_INTERVAL_MS);
    poller.stop();

    expect(deps.readAll).toHaveBeenCalledOnce();
  });
});
