import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  themeFromRow,
  themeToColumns,
} from "../../src/modules/portalConfig/portalConfig.mappers.ts";
import { THEME_TOKEN_KEYS, type PortalTheme } from "../../src/shared/types/portalConfig.ts";
import type { SystemThemeRow } from "../../src/shared/types/systemTheme.ts";

/** Constrói uma linha completa a partir das colunas do mapper (fake tipado). */
function makeRow(
  theme: PortalTheme,
  overrides: Partial<Record<string, string | number | boolean | null>> = {},
): SystemThemeRow {
  return { ...themeToColumns(theme), ...overrides } as unknown as SystemThemeRow;
}

describe("portalConfig.mappers", () => {
  it("themeFromRow(undefined) devolve o DEFAULT_THEME", () => {
    expect(themeFromRow(undefined)).toEqual(DEFAULT_THEME);
  });

  it("faz round-trip de um tema não-default sem perder valores", () => {
    const custom: PortalTheme = structuredClone(DEFAULT_THEME);
    custom.light.primary = "#123456";
    custom.light.gradient = { from: "#111111", to: "#222222", angle: 90 };
    custom.dark.statuses.warning = {
      color: "#abcdef",
      background: "#123456",
      backgroundLocked: false,
    };

    const restored = themeFromRow(makeRow(custom));

    expect(restored).toEqual(custom);
  });

  it("faz round-trip de TODAS as colunas com valores únicos e não-default", () => {
    const custom = structuredClone(DEFAULT_THEME);
    let counter = 0;
    const nextHex = () => `#${String(++counter).padStart(6, "0")}`;

    for (const palette of ["light", "dark"] as const) {
      const tokens = custom[palette] as unknown as Record<string, string>;
      for (const token of THEME_TOKEN_KEYS) {
        tokens[token] = nextHex();
      }
      custom[palette].gradient = { from: nextHex(), to: nextHex(), angle: 200 + counter };
      for (const tone of ["error", "success", "info", "warning", "neutral"] as const) {
        custom[palette].statuses[tone] = {
          color: nextHex(),
          background: nextHex(),
          backgroundLocked: false,
        };
      }
    }

    const columns = themeToColumns(custom);
    expect(Object.keys(columns)).toHaveLength(62);
    expect(themeFromRow(makeRow(custom))).toEqual(custom);
  });

  it("themeToColumns aplica o ângulo default 143 quando ausente", () => {
    const theme = structuredClone(DEFAULT_THEME);
    theme.light.gradient.angle = undefined;
    theme.dark.gradient.angle = undefined;

    const columns = themeToColumns(theme);

    expect(columns.light_gradient_angle).toBe(143);
    expect(columns.dark_gradient_angle).toBe(143);
  });

  it("themeToColumns achata tokens, gradiente e statuses com o prefixo da paleta", () => {
    const custom: PortalTheme = structuredClone(DEFAULT_THEME);
    custom.light.textPrimary = "#101010";
    custom.light.gradient.angle = 45;
    custom.dark.statuses.error = {
      color: "#ff0000",
      background: "#00ff00",
      backgroundLocked: false,
    };

    const columns = themeToColumns(custom);

    expect(columns.light_text_primary).toBe("#101010");
    expect(columns.light_gradient_angle).toBe(45);
    expect(columns.dark_status_error_color).toBe("#ff0000");
    expect(columns.dark_status_error_background).toBe("#00ff00");
    expect(columns.dark_status_error_background_locked).toBe(false);
  });

  it("colunas NULL caem para o default do contrato; backgroundLocked NULL vira false", () => {
    const row = makeRow(DEFAULT_THEME, {
      light_primary: null,
      light_status_error_color: null,
      light_status_error_background_locked: null,
    });

    const theme = themeFromRow(row);
    expect(theme.light.primary).toBe(DEFAULT_THEME.light.primary);
    expect(theme.light.statuses.error.color).toBe(DEFAULT_THEME.light.statuses.error.color);
    // Regra específica: NULL em backgroundLocked = false (não o default true do seed).
    expect(theme.light.statuses.error.backgroundLocked).toBe(false);
  });

  it("respeita valores não-default da linha em vez de repetir o DEFAULT_THEME", () => {
    const row = makeRow(DEFAULT_THEME, {
      light_primary: "#0a0b0c",
      dark_background: "#ffffff",
      light_gradient_from: "#fedcba",
      light_gradient_angle: 12,
    });

    const theme = themeFromRow(row);

    expect(theme.light.primary).toBe("#0a0b0c");
    expect(theme.dark.background).toBe("#ffffff");
    expect(theme.light.gradient.from).toBe("#fedcba");
    expect(theme.light.gradient.angle).toBe(12);
  });
});
