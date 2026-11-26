import { describe, expect, it } from "vitest";
import type { DemandBlock } from "../../src/shared/types/requests.ts";
import {
  buildDuplicateQuery,
  buildDuplicateQueryTerms,
  DUPLICATE_QUERY_TERM_LIMIT,
} from "../../src/modules/duplicates/query.ts";

function demand(overrides: Partial<DemandBlock> = {}): DemandBlock {
  return {
    title: "",
    requestType: "",
    category: "",
    processName: "",
    description: "",
    problem: "",
    expectedResult: "",
    justification: "",
    ...overrides,
  };
}

describe("consulta lexical da Demanda", () => {
  it("remove acentos, minúsculas e stopwords", () => {
    const terms = buildDuplicateQueryTerms(
      demand({ title: "A automação DO processo de conciliação" }),
    );

    expect(terms).toEqual(["automacao", "processo", "conciliacao"]);
  });

  it("reduz plural leve e deduplica por stem", () => {
    const terms = buildDuplicateQueryTerms(demand({ title: "relatórios relatório" }));

    expect(terms).toEqual(["relatorio"]);
  });

  it("canonicaliza sinônimos do protótipo", () => {
    const terms = buildDuplicateQueryTerms(demand({ title: "dashboard" }));

    expect(terms).toContain("dashboard");
    expect(terms).toContain("painel");
  });

  it("não trata Protocolo como sinônimo de chamado", () => {
    expect(buildDuplicateQueryTerms(demand({ title: "protocolo" }))).toEqual(["protocolo"]);
  });

  it("prioriza título, categoria e processo sobre os textos longos", () => {
    const terms = buildDuplicateQueryTerms(
      demand({
        title: "alfa beta",
        category: "gama",
        processName: "delta",
        description: "epsilon zeta",
        problem: "eta",
        expectedResult: "teta",
        justification: "iota",
      }),
    );

    expect(terms.slice(0, 4)).toEqual(["alfa", "beta", "gama", "delta"]);
  });

  it("limita a consulta a 12 termos", () => {
    const title = Array.from({ length: 30 }, (_, index) => `termo${index}`).join(" ");
    const terms = buildDuplicateQueryTerms(demand({ title }));

    expect(terms).toHaveLength(DUPLICATE_QUERY_TERM_LIMIT);
  });

  it("devolve string vazia quando a Demanda só tem stopwords", () => {
    expect(buildDuplicateQuery(demand({ title: "a o de da para" }))).toBe("");
  });
});
