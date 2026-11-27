import { describe, expect, it } from "vitest";
import {
  resolveSuppressionReason,
  type SuppressionSignals,
} from "../../src/modules/duplicates/projection.ts";

function signals(overrides: Partial<SuppressionSignals> = {}): SuppressionSignals {
  return {
    statusIsActive: true,
    statusIsTerminal: false,
    statusIsCompleted: false,
    handlesRestrictedInfo: false,
    statusIsRestricted: false,
    hasConcludedAt: false,
    concludedAtIsWithinWindow: false,
    categoryIsPubliclyListable: true,
    statusIsCorpusEligible: true,
    ...overrides,
  };
}

const completedWithinWindow = {
  statusIsTerminal: true,
  statusIsCompleted: true,
  hasConcludedAt: true,
  concludedAtIsWithinWindow: true,
} satisfies Partial<SuppressionSignals>;

describe("precedência de supressão da projeção pública", () => {
  it("publica aberta elegível e concluída dentro da janela", () => {
    expect(resolveSuppressionReason(signals())).toBeNull();
    expect(resolveSuppressionReason(signals(completedWithinWindow))).toBeNull();
  });

  it("inativo vence todos os demais motivos", () => {
    expect(
      resolveSuppressionReason(
        signals({
          ...completedWithinWindow,
          statusIsActive: false,
          handlesRestrictedInfo: true,
          categoryIsPubliclyListable: false,
        }),
      ),
    ).toBe("inactive_status");
  });

  it("terminal só suprime quando não é o Status 16", () => {
    expect(resolveSuppressionReason(signals({ statusIsTerminal: true }))).toBe("terminal_status");
    expect(resolveSuppressionReason(signals(completedWithinWindow))).toBeNull();
  });

  it("restrição da solicitação vence status restrito e a janela", () => {
    expect(
      resolveSuppressionReason(
        signals({
          ...completedWithinWindow,
          handlesRestrictedInfo: true,
          statusIsRestricted: true,
          concludedAtIsWithinWindow: false,
        }),
      ),
    ).toBe("restricted_request");
  });

  it("status restrito vence os motivos de concluída", () => {
    expect(
      resolveSuppressionReason(signals({ ...completedWithinWindow, statusIsRestricted: true })),
    ).toBe("restricted_status");
  });

  it("concluída sem concluded_at é missing_concluded_at", () => {
    expect(
      resolveSuppressionReason(
        signals({
          ...completedWithinWindow,
          hasConcludedAt: false,
        }),
      ),
    ).toBe("missing_concluded_at");
  });

  it("concluída fora da janela é outside_window", () => {
    expect(
      resolveSuppressionReason(
        signals({ ...completedWithinWindow, concludedAtIsWithinWindow: false }),
      ),
    ).toBe("outside_window");
  });

  it("categoria e status desligados só suprimem depois da janela", () => {
    expect(resolveSuppressionReason(signals({ categoryIsPubliclyListable: false }))).toBe(
      "ineligible_category",
    );
    expect(resolveSuppressionReason(signals({ statusIsCorpusEligible: false }))).toBe(
      "ineligible_status",
    );
    expect(
      resolveSuppressionReason(
        signals({
          ...completedWithinWindow,
          categoryIsPubliclyListable: false,
          statusIsCorpusEligible: false,
        }),
      ),
    ).toBe("ineligible_category");
  });

  it("trata ausência de handles_restricted_info como não restrita", () => {
    expect(resolveSuppressionReason(signals({ handlesRestrictedInfo: null }))).toBeNull();
  });
});
