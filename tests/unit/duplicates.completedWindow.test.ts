import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  createDuplicateCompletedWindowFallbackWarner,
  DEFAULT_DUPLICATE_COMPLETED_WINDOW,
  parseDuplicateCompletedWindow,
  type DuplicateCompletedWindow,
} from "../../src/modules/duplicates/completedWindow.ts";

describe("janela do corpus de concluídas", () => {
  it.each([1, 3, 36])("aceita %i mês(es)", (months) => {
    expect(parseDuplicateCompletedWindow(months)).toEqual({ months });
  });

  it.each([0, 37, 1.5, -1, "3", null, undefined])("recusa o valor inválido %s", (value) => {
    expect(parseDuplicateCompletedWindow(value)).toBeNull();
  });

  it("expõe o default 3 quando a configuração está ausente ou inválida", () => {
    expect(DEFAULT_DUPLICATE_COMPLETED_WINDOW).toEqual({ months: 3 });
  });

  it("impede construir a janela fora do parser", () => {
    expectTypeOf<{ months: number }>().not.toMatchTypeOf<DuplicateCompletedWindow>();
  });

  it("dispara o aviso de fallback uma única vez por processo", () => {
    const warn = vi.fn();
    const onFallback = createDuplicateCompletedWindowFallbackWarner(warn);

    onFallback("primeiro aviso");
    onFallback("segundo aviso");

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith("primeiro aviso");
  });
});
