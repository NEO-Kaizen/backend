import { describe, expect, it } from "vitest";
import type { SimilarityDocument } from "../../src/shared/types/duplicates.ts";
import { MiniSearchIndex } from "../../src/modules/duplicates/miniSearchIndex.ts";
import { DUPLICATE_SEARCH_LIMIT } from "../../src/modules/duplicates/similarityIndex.ts";

function document(publicId: string, title: string): SimilarityDocument {
  return {
    publicId,
    title,
    summary: "Solicitação em andamento da categoria Automação, registrada no período 2026-Q4.",
    category: "Automação",
    status: "Em andamento",
    period: "2026-Q4",
  };
}

describe("adaptador MiniSearch do índice de duplicidade", () => {
  it("adiciona documento novo e encontra pela busca", () => {
    const index = new MiniSearchIndex();

    index.upsert(document("a", "Conciliação bancária"));

    expect(index.search("conciliacao", DUPLICATE_SEARCH_LIMIT)).toMatchObject([
      { publicId: "a", title: "Conciliação bancária" },
    ]);
  });

  it("substitui documento existente sem duplicar", () => {
    const index = new MiniSearchIndex();

    index.upsert(document("a", "Conciliação bancária"));
    index.upsert(document("a", "Orçamento de viagem"));

    expect(index.search("conciliacao", DUPLICATE_SEARCH_LIMIT)).toEqual([]);
    expect(index.search("orcamento", DUPLICATE_SEARCH_LIMIT)).toMatchObject([{ publicId: "a" }]);
  });

  it("remove documento existente e ignora id ausente", () => {
    const index = new MiniSearchIndex();

    index.upsert(document("a", "Conciliação bancária"));

    expect(() => index.remove("inexistente")).not.toThrow();

    index.remove("a");

    expect(index.search("conciliacao", DUPLICATE_SEARCH_LIMIT)).toEqual([]);
  });

  it("rebuild substitui todo o conteúdo anterior", () => {
    const index = new MiniSearchIndex();

    index.upsert(document("a", "Conciliação bancária"));
    index.rebuild([document("b", "Orçamento de viagem")]);

    expect(index.search("conciliacao", DUPLICATE_SEARCH_LIMIT)).toEqual([]);
    expect(index.search("orcamento", DUPLICATE_SEARCH_LIMIT)).toMatchObject([{ publicId: "b" }]);
  });

  it("limita a busca ao topo configurado", () => {
    const index = new MiniSearchIndex();
    const documents = Array.from({ length: DUPLICATE_SEARCH_LIMIT + 5 }, (_, position) =>
      document(`doc-${position}`, "Conciliação bancária"),
    );

    index.rebuild(documents);

    expect(index.search("conciliacao", 100)).toHaveLength(DUPLICATE_SEARCH_LIMIT);
  });
});
