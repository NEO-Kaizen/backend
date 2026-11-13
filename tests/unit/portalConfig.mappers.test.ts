import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  themeFromRow,
  themeToColumns,
} from "../../src/modules/portalConfig/portalConfig.mappers.ts";
import type { SystemThemeRow } from "../../src/shared/types/systemTheme.ts";

describe("portalConfig.mappers", () => {
  it("themeFromRow(undefined) devolve o DEFAULT_THEME", () => {
    expect(themeFromRow(undefined)).toEqual(DEFAULT_THEME);
  });

  it("faz round-trip tema → colunas → tema", () => {
    const columns = themeToColumns(DEFAULT_THEME);
    const restored = themeFromRow(columns as unknown as SystemThemeRow);

    expect(restored.light.primary).toBe(DEFAULT_THEME.light.primary);
    expect(restored.dark.background).toBe(DEFAULT_THEME.dark.background);
    expect(restored.light.gradient).toEqual(DEFAULT_THEME.light.gradient);
    expect(restored.dark.statuses.warning).toEqual(DEFAULT_THEME.dark.statuses.warning);
  });

  it("themeToColumns achata tokens, gradiente e statuses com o prefixo da paleta", () => {
    const columns = themeToColumns(DEFAULT_THEME);

    expect(columns.light_primary).toBe(DEFAULT_THEME.light.primary);
    expect(columns.dark_text_primary).toBe(DEFAULT_THEME.dark.textPrimary);
    expect(columns.light_gradient_from).toBe(DEFAULT_THEME.light.gradient.from);
    expect(columns.light_gradient_angle).toBe(143);
    expect(columns.dark_status_error_color).toBe(DEFAULT_THEME.dark.statuses.error.color);
    expect(columns.dark_status_error_background_locked).toBe(true);
  });

  it("colunas NULL caem para o default do contrato; backgroundLocked NULL vira false", () => {
    const row = {
      light_primary: null,
      light_status_error_color: null,
      light_status_error_background_locked: null,
    } as unknown as SystemThemeRow;

    const theme = themeFromRow(row);
    expect(theme.light.primary).toBe(DEFAULT_THEME.light.primary);
    expect(theme.light.statuses.error.color).toBe(DEFAULT_THEME.light.statuses.error.color);
    // Regra específica: NULL em backgroundLocked = false (não o default true do seed).
    expect(theme.light.statuses.error.backgroundLocked).toBe(false);
  });
});
