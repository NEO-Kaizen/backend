import { describe, expect, it } from "vitest";
import {
  nullableOptionalString,
  optionalText,
  requiredText,
} from "../../src/shared/validation/fieldSchemas.ts";
import { queueQuerySchema } from "../../src/modules/queue/queue.schemas.ts";
import { evaluateScoreSchema } from "../../src/modules/prioritization/prioritization.schema.ts";
import {
  updateCategoriesSchema,
  updateDuplicateDetectionSchema,
  updatePrioritizationWeightsSchema,
  updateStatusesSchema,
} from "../../src/modules/portalConfig/portalConfig.schema.ts";

describe("fieldSchemas", () => {
  it("requiredText aceita letras/espaços e recusa símbolos", () => {
    expect(requiredText(20).safeParse("Maria Silva").success).toBe(true);
    expect(requiredText(20).safeParse("Maria 123").success).toBe(false);
    expect(requiredText(20).safeParse("").success).toBe(false);
  });

  it("optionalText transforma vazio em undefined e valida charset", () => {
    expect(optionalText(10).parse("")).toBeUndefined();
    expect(optionalText(10).parse("Financeiro")).toBe("Financeiro");
    expect(optionalText(10).safeParse("Financeiro 2").success).toBe(false);
  });

  it("nullableOptionalString aceita null/vazio e recusa acima do limite", () => {
    expect(nullableOptionalString(5).parse(null)).toBeNull();
    expect(nullableOptionalString(5).parse("")).toBeNull();
    expect(nullableOptionalString(5).safeParse("123456").success).toBe(false);
  });
});

describe("queueQuerySchema", () => {
  it("exige paginação e converte strings numéricas", () => {
    const parsed = queueQuerySchema.safeParse({ page: "1", pageSize: "10" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({ page: 1, pageSize: 10 });
    }

    expect(queueQuerySchema.safeParse({}).success).toBe(false);
    expect(queueQuerySchema.safeParse({ page: "0", pageSize: "10" }).success).toBe(false);
    expect(queueQuerySchema.safeParse({ page: "1", pageSize: "101" }).success).toBe(false);
  });

  it("recusa combinação incompatível de unassigned com assigneeId", () => {
    const parsed = queueQuerySchema.safeParse({
      page: "1",
      pageSize: "10",
      unassigned: "true",
      assigneeId: "20",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("não podem ser combinados");
    }
  });

  it("aceita prioridade válida e recusa prioridade desconhecida", () => {
    expect(
      queueQuerySchema.safeParse({ page: "1", pageSize: "10", priority: "Alta" }).success,
    ).toBe(true);
    expect(
      queueQuerySchema.safeParse({ page: "1", pageSize: "10", priority: "Altíssima" }).success,
    ).toBe(false);
  });
});

describe("evaluateScoreSchema", () => {
  it("exige ao menos uma nota e limita as notas a 1..5", () => {
    expect(evaluateScoreSchema.safeParse({ notes: { urgencia: 5 } }).success).toBe(true);
    expect(evaluateScoreSchema.safeParse({ notes: {} }).success).toBe(false);
    expect(evaluateScoreSchema.safeParse({ notes: { urgencia: 0 } }).success).toBe(false);
    expect(evaluateScoreSchema.safeParse({ notes: { urgencia: 6 } }).success).toBe(false);
    expect(evaluateScoreSchema.safeParse({ notes: { urgencia: 2.5 } }).success).toBe(false);
  });
});

describe("portalConfig.schema", () => {
  const category = {
    id: 1,
    name: "Automação",
    description: "Automação de processos",
    isActive: true,
    isPubliclyListable: true,
  };

  it("recusa categorias com nome duplicado (case-insensitive)", () => {
    const parsed = updateCategoriesSchema.safeParse({
      categories: [category, { ...category, id: 2, name: "automação" }],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("únicos");
    }
  });

  it("exige ao menos uma categoria ativa", () => {
    const parsed = updateCategoriesSchema.safeParse({
      categories: [{ ...category, isActive: false }],
    });
    expect(parsed.success).toBe(false);
  });

  const status = {
    id: 1,
    name: "Solicitação enviada",
    isCore: true,
    isPublic: true,
    isTerminal: false,
    triageMode: "none" as const,
    mappingMode: "none" as const,
    isRestricted: false,
    tone: "info" as const,
    isActive: true,
    isDuplicateCorpusEligible: true,
  };

  it("exige isPubliclyListable e isDuplicateCorpusEligible (contrato required)", () => {
    const { isPubliclyListable: _categoryFlag, ...categoryWithoutFlag } = category;
    const { isDuplicateCorpusEligible: _statusFlag, ...statusWithoutFlag } = status;

    expect(updateCategoriesSchema.safeParse({ categories: [categoryWithoutFlag] }).success).toBe(
      false,
    );
    expect(updateStatusesSchema.safeParse({ statuses: [statusWithoutFlag] }).success).toBe(false);
  });

  it("recusa status core desativado e status restrito com fluxo", () => {
    expect(
      updateStatusesSchema.safeParse({ statuses: [{ ...status, isActive: false }] }).success,
    ).toBe(false);

    expect(
      updateStatusesSchema.safeParse({
        statuses: [{ ...status, id: 2, isCore: false, isRestricted: true, triageMode: "free" }],
      }).success,
    ).toBe(false);
  });

  it("exige todos os pesos de priorização na escala 1..10", () => {
    const weights = {
      operationalImpact: 10,
      operationalRisk: 10,
      urgency: 10,
      volumetry: 10,
      manualEffort: 10,
      clientImpact: 10,
      regulatoryDeadline: 10,
      affectedAreas: 10,
      strategicAlignment: 10,
      estimatedComplexity: 10,
    };

    expect(
      updatePrioritizationWeightsSchema.safeParse({ prioritizationWeights: weights }).success,
    ).toBe(true);

    const missing = { ...weights } as Record<string, number>;
    delete missing.urgency;
    expect(
      updatePrioritizationWeightsSchema.safeParse({ prioritizationWeights: missing }).success,
    ).toBe(false);

    expect(
      updatePrioritizationWeightsSchema.safeParse({
        prioritizationWeights: { ...weights, urgency: 11 },
      }).success,
    ).toBe(false);
  });
});

describe("updateDuplicateDetectionSchema", () => {
  it("aceita os limites 1..36 e rejeita janela fora deles", () => {
    for (const completedWindowMonths of [1, 36]) {
      expect(
        updateDuplicateDetectionSchema.safeParse({ enabled: true, completedWindowMonths }).success,
      ).toBe(true);
    }
    for (const completedWindowMonths of [0, 37, 1.5]) {
      expect(
        updateDuplicateDetectionSchema.safeParse({ enabled: true, completedWindowMonths }).success,
      ).toBe(false);
    }
  });

  it("exige os dois campos e nenhum adicional", () => {
    expect(updateDuplicateDetectionSchema.safeParse({ enabled: true }).success).toBe(false);
    expect(
      updateDuplicateDetectionSchema.safeParse({
        enabled: true,
        completedWindowMonths: 3,
        extra: 1,
      }).success,
    ).toBe(false);
  });
});
