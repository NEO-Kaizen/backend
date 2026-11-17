import { describe, expect, it } from "vitest";
import {
  assertActiveCriteriaCount,
  calculateScore,
} from "../../src/modules/prioritization/prioritization.service.ts";
import { makeCriteria } from "../helpers/factories.ts";

describe("prioritization.calculateScore (RN-007)", () => {
  it("calcula a média ponderada normalizada ×10", () => {
    const criteria = makeCriteria(Array(10).fill(5));
    const notes = Object.fromEntries(criteria.map((c) => [c.criterion_id, 5]));

    // soma ponderada 250 / soma pesos 50 = 5 → ×10 = 50
    expect(calculateScore(notes, criteria)).toBe(50);
  });

  it("respeita pesos diferentes por critério", () => {
    const criteria = makeCriteria(Array(10).fill(1));
    criteria[0]!.weight = 10; // soma dos pesos = 9 + 10 = 19
    const notes = Object.fromEntries(criteria.map((c) => [c.criterion_id, 1]));
    notes[criteria[0]!.criterion_id] = 5;

    // (5*10 + 1*9) / 19 = 59/19 = 3.105... → ×10 = 31.1
    expect(calculateScore(notes, criteria)).toBe(31.1);
  });

  it("trata notas ausentes como zero", () => {
    const criteria = makeCriteria(Array(10).fill(5));
    const notes = { [criteria[0]!.criterion_id]: 5 };
    // (5*5)/50*10 = 5
    expect(calculateScore(notes, criteria)).toBe(5);
  });

  it("lança 500 quando a soma dos pesos é zero", () => {
    const criteria = makeCriteria(Array(10).fill(0));
    expect(() => calculateScore({}, criteria)).toThrowError(/soma dos pesos/i);
  });
});

describe("prioritization.assertActiveCriteriaCount (RN-007)", () => {
  it("aceita exatamente 10 critérios ativos", () => {
    expect(() => assertActiveCriteriaCount(makeCriteria())).not.toThrow();
  });

  it("recusa configuração com contagem divergente", () => {
    expect(() => assertActiveCriteriaCount(makeCriteria().slice(0, 9))).toThrowError(
      /esperados 10 critérios ativos/,
    );
  });
});
