import { afterEach, describe, expect, it, vi } from "vitest";
import type { SimilarityDocument } from "../../src/shared/types/duplicates.ts";
import {
  createIndexPoller,
  DUPLICATE_INDEX_POLL_INTERVAL_MS,
  type IndexPollChange,
} from "../../src/modules/duplicates/indexPoller.ts";

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
}) {
  const apply = vi.fn();
  const remove = vi.fn();
  const clear = vi.fn();
  const readAll = vi.fn(async () => overrides.documents ?? []);
  const readChanges = vi.fn(overrides.readChanges ?? (async () => overrides.changes ?? []));

  return {
    apply,
    remove,
    clear,
    readAll,
    readChanges,
    options: {
      readEnabled: vi.fn(async () => overrides.enabled ?? true),
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
