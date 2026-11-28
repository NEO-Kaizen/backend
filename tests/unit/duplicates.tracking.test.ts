import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DemandBlock } from "../../src/shared/types/requests.ts";
import type { SimilarityHit } from "../../src/shared/types/duplicates.ts";

vi.mock("../../src/modules/duplicates/duplicates.repository.ts", () => ({
  isDuplicateDetectionEnabled: vi.fn(),
  findPublishedPublicIdByRequestId: vi.fn(),
}));

vi.mock("../../src/modules/duplicates/indexLifecycle.ts", () => ({
  searchDuplicateIndex: vi.fn(),
}));

const repository = await import("../../src/modules/duplicates/duplicates.repository.ts");
const indexLifecycle = await import("../../src/modules/duplicates/indexLifecycle.ts");
const { findDuplicatesForRequest } =
  await import("../../src/modules/duplicates/duplicates.service.ts");

const DEMAND: DemandBlock = {
  title: "Automatizar conciliação bancária",
  requestType: "Automação",
  category: "Automação",
  processName: "Conciliação bancária mensal",
  description: "Conferência manual de extratos.",
  problem: "Retrabalho no fechamento.",
  expectedResult: "Conciliação automática.",
  justification: "Reduzir esforço manual.",
};

function hit(publicId: string, score: number): SimilarityHit {
  return {
    publicId,
    title: "Solicitação de Automação em andamento",
    summary: "Solicitação em andamento da categoria Automação, registrada no período 2026-Q4.",
    category: "Automação",
    status: "Em andamento",
    period: "2026-Q4",
    score,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(repository.isDuplicateDetectionEnabled).mockResolvedValue(true);
  vi.mocked(repository.findPublishedPublicIdByRequestId).mockResolvedValue("own-public-id");
  vi.mocked(indexLifecycle.searchDuplicateIndex).mockReturnValue([]);
});

describe("duplicates.service — seção do Acompanhamento (issue #211)", () => {
  it("exclui a própria Solicitação e devolve no máximo 5 itens", async () => {
    vi.mocked(indexLifecycle.searchDuplicateIndex).mockReturnValue([
      hit("own-public-id", 1),
      hit("related-1", 1),
      hit("related-2", 1),
      hit("related-3", 1),
      hit("related-4", 1),
      hit("related-5", 1),
      hit("related-6", 1),
    ]);

    const body = await findDuplicatesForRequest("42", DEMAND);

    expect(body.confidence).toBe("medium");
    expect(body.items).toHaveLength(5);
    expect(body.items.map((item) => item.publicId)).not.toContain("own-public-id");
    expect(body.items.map((item) => item.publicId)).toEqual([
      "related-1",
      "related-2",
      "related-3",
      "related-4",
      "related-5",
    ]);
  });

  it("responde vazio quando a própria Solicitação não está publicada", async () => {
    vi.mocked(repository.findPublishedPublicIdByRequestId).mockResolvedValue(undefined);

    await expect(findDuplicatesForRequest("42", DEMAND)).resolves.toEqual({
      confidence: "none",
      items: [],
    });
  });

  it("responde vazio quando a flag está desligada", async () => {
    vi.mocked(repository.isDuplicateDetectionEnabled).mockResolvedValue(false);

    await expect(findDuplicatesForRequest("42", DEMAND)).resolves.toEqual({
      confidence: "none",
      items: [],
    });
  });
});
