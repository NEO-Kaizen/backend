import { describe, expect, it } from "vitest";
import {
  classifyDuplicateConfidence,
  DUPLICATE_CONFIDENCE_CONFIG,
  normalizeSimilarityScore,
} from "../../src/modules/duplicates/confidence.ts";

describe("normalização da similaridade", () => {
  it("mapeia score bruto para score / (score + 1)", () => {
    expect(normalizeSimilarityScore(1)).toBe(0.5);
    expect(normalizeSimilarityScore(3)).toBe(0.75);
    expect(normalizeSimilarityScore(0)).toBe(0);
    expect(normalizeSimilarityScore(-2)).toBe(0);
    expect(normalizeSimilarityScore(Number.NaN)).toBe(0);
  });
});

describe("regra de confiança do Alerta de duplicidade", () => {
  it("sem candidatos é none", () => {
    expect(classifyDuplicateConfidence([])).toBe("none");
  });

  it("um candidato único acima do piso é alta (margem satisfeita)", () => {
    expect(classifyDuplicateConfidence([1])).toBe("high");
  });

  it("topo forte e bem acima do segundo é alta", () => {
    expect(classifyDuplicateConfidence([3, 1])).toBe("high");
  });

  it("dois candidatos equivalentes são média (margem reprovada)", () => {
    expect(classifyDuplicateConfidence([1, 1])).toBe("medium");
  });

  it("topo abaixo do piso é none", () => {
    expect(classifyDuplicateConfidence([0.1])).toBe("none");
  });

  it("borda do piso: logo abaixo é none e logo acima é alta", () => {
    const rawAtFloor = DUPLICATE_CONFIDENCE_CONFIG.floor / (1 - DUPLICATE_CONFIDENCE_CONFIG.floor);

    expect(classifyDuplicateConfidence([rawAtFloor - 0.001])).toBe("none");
    expect(classifyDuplicateConfidence([rawAtFloor + 0.001])).toBe("high");
  });

  it("aplica a margem relativa entre topo e segundo", () => {
    const second = 2;
    const normalizedSecond = normalizeSimilarityScore(second);
    const rawForNormalized = (value: number) => value / (1 - value);
    const atMargin = rawForNormalized(
      DUPLICATE_CONFIDENCE_CONFIG.margin * normalizedSecond + 0.0001,
    );
    const belowMargin = rawForNormalized(
      DUPLICATE_CONFIDENCE_CONFIG.margin * normalizedSecond - 0.0001,
    );

    expect(classifyDuplicateConfidence([atMargin, second])).toBe("high");
    expect(classifyDuplicateConfidence([belowMargin, second])).toBe("medium");
  });
});
