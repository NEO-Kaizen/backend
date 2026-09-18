import type { PortalTheme, ThemeTokenKey, ThemeTokens } from "../../shared/types/portalConfig.ts";
import type { SystemThemeRow } from "../../shared/types/systemTheme.ts";

/**
 * Mapeadores da configuração do portal — ponte entre o shape do contrato
 * (`PortalTheme`, camelCase, aninhado) e a persistência (`system_themes`,
 * snake_case, colunas planas por paleta), além de `system_settings`.
 */

/** Suffixos das colunas da tabela `system_themes` por token do contrato. */
const TOKEN_TO_COLUMN: Record<ThemeTokenKey, string> = {
  background: "background",
  surface: "surface",
  border: "border",
  textPrimary: "text_primary",
  textSecondary: "text_secondary",
  richBlack: "rich_black",
  primary: "primary",
  secondary: "secondary",
  tint: "tint",
  onPrimary: "on_primary",
  onDark: "on_dark",
  onGradient: "on_gradient",
};

const TONES = ["error", "success", "info", "warning", "neutral"] as const;

type Palette = "light" | "dark";

/**
 * Padrões do contrato quando o tema ainda não foi definido (cores NULL no
 * `system_themes`) — decisão issue-59 §8.2: o GET devolve os defaults do
 * contrato, não `null`.
 */
export const DEFAULT_THEME: PortalTheme = {
  light: {
    background: "#f0f4f8",
    surface: "#fafafa",
    border: "#e5e7eb",
    textPrimary: "#3c3e47",
    textSecondary: "#757682",
    richBlack: "#0f1a2a",
    primary: "#00236f",
    secondary: "#0058be",
    tint: "#d6e7fb",
    onPrimary: "#ffffff",
    onDark: "#ffffff",
    onGradient: "#ffffff",
    gradient: { from: "#002068", to: "#003399", angle: 143 },
    statuses: {
      error: { color: "#ef4444", background: "#ef444410", backgroundLocked: true },
      success: { color: "#10b981", background: "#10b98110", backgroundLocked: true },
      info: { color: "#0058be", background: "#0058be10", backgroundLocked: true },
      warning: { color: "#956006", background: "#f59e0b10", backgroundLocked: true },
      neutral: { color: "#4b5563", background: "#e5e7eb", backgroundLocked: true },
    },
  },
  dark: {
    background: "#0b0f1a",
    surface: "#141b2e",
    border: "#2a3346",
    textPrimary: "#e5e7eb",
    textSecondary: "#9aa3b2",
    richBlack: "#0f1a2a",
    primary: "#4c7dff",
    secondary: "#5b9bff",
    tint: "#1b2942",
    onPrimary: "#0b0f1a",
    onDark: "#ffffff",
    onGradient: "#ffffff",
    gradient: { from: "#0b0f1a", to: "#1b2942", angle: 143 },
    statuses: {
      error: { color: "#f87171", background: "#4c0f0a", backgroundLocked: true },
      success: { color: "#4ade80", background: "#0f2e1d", backgroundLocked: true },
      info: { color: "#5b9bff", background: "#1b2942", backgroundLocked: true },
      warning: { color: "#fbbf24", background: "#4a2e0f", backgroundLocked: true },
      neutral: { color: "#9aa3b2", background: "#2a3346", backgroundLocked: true },
    },
  },
};

const palettes: Palette[] = ["light", "dark"];

/** Coluna de um token de cor (hex) dentro de uma paleta. */
function tokenColumn(palette: Palette, token: ThemeTokenKey): string {
  return `${palette}_${TOKEN_TO_COLUMN[token]}`;
}

/** Coluna de uma parte do gradiente numa paleta. */
function gradientColumn(palette: Palette, part: "from" | "to"): string {
  return `${palette}_gradient_${part}`;
}

function statusColumns(
  palette: Palette,
  tone: (typeof TONES)[number],
): {
  color: string;
  background: string;
  backgroundLocked: string;
} {
  return {
    color: `${palette}_status_${tone}_color`,
    background: `${palette}_status_${tone}_background`,
    backgroundLocked: `${palette}_status_${tone}_background_locked`,
  };
}

/**
 * Converte o tema do contrato (JSON aninhado) em colunas da tabela
 * `system_themes` (planas). Ângulo ausente assume o default 143 do contrato.
 */
export function themeToColumns(theme: PortalTheme): Record<string, string | number | boolean> {
  const columns: Record<string, string | number | boolean> = {};

  for (const palette of palettes) {
    const tokens = theme[palette];
    for (const token of Object.keys(TOKEN_TO_COLUMN) as ThemeTokenKey[]) {
      columns[tokenColumn(palette, token)] = tokens[token];
    }
    columns[gradientColumn(palette, "from")] = tokens.gradient.from;
    columns[gradientColumn(palette, "to")] = tokens.gradient.to;
    columns[`${palette}_gradient_angle`] = tokens.gradient.angle ?? 143;

    for (const tone of TONES) {
      const { color, background, backgroundLocked } = statusColumns(palette, tone);
      columns[color] = tokens.statuses[tone].color;
      columns[background] = tokens.statuses[tone].background;
      columns[backgroundLocked] = tokens.statuses[tone].backgroundLocked;
    }
  }

  return columns;
}

/**
 * Converte a linha `system_themes` (plana) no tema do contrato. Quando uma
 * coluna está NULL (tema ainda não definido), aplica o default do contrato
 * (§8.2) — nunca expõe `null` ao cliente.
 */
export function themeFromRow(row: SystemThemeRow | undefined): PortalTheme {
  if (!row) {
    return DEFAULT_THEME;
  }

  const read = (palette: Palette, token: ThemeTokenKey): string =>
    (row[tokenColumn(palette, token) as keyof SystemThemeRow] as string | null) ??
    DEFAULT_THEME[palette][token];

  const readGradient = (palette: Palette, part: "from" | "to"): string =>
    (row[gradientColumn(palette, part) as keyof SystemThemeRow] as string | null) ??
    DEFAULT_THEME[palette].gradient[part];

  const readAngle = (palette: Palette): number =>
    (row[`${palette}_gradient_angle` as keyof SystemThemeRow] as number | null) ??
    DEFAULT_THEME[palette].gradient.angle!;

  const readStatus = (
    palette: Palette,
    tone: (typeof TONES)[number],
  ): ThemeTokens["statuses"][(typeof TONES)[number]] => {
    const { color, background, backgroundLocked } = statusColumns(palette, tone);
    return {
      color:
        (row[color as keyof SystemThemeRow] as string | null) ??
        DEFAULT_THEME[palette].statuses[tone].color,
      background:
        (row[background as keyof SystemThemeRow] as string | null) ??
        DEFAULT_THEME[palette].statuses[tone].background,
      backgroundLocked:
        (row[backgroundLocked as keyof SystemThemeRow] as boolean | null) ??
        DEFAULT_THEME[palette].statuses[tone].backgroundLocked,
    };
  };

  const buildPalette = (palette: Palette): ThemeTokens => {
    const tokenEntries = (Object.keys(TOKEN_TO_COLUMN) as ThemeTokenKey[]).map((token) => [
      token,
      read(palette, token),
    ]);
    return {
      ...(Object.fromEntries(tokenEntries) as Record<ThemeTokenKey, string>),
      gradient: {
        from: readGradient(palette, "from"),
        to: readGradient(palette, "to"),
        angle: readAngle(palette),
      },
      statuses: {
        error: readStatus(palette, "error"),
        success: readStatus(palette, "success"),
        info: readStatus(palette, "info"),
        warning: readStatus(palette, "warning"),
        neutral: readStatus(palette, "neutral"),
      },
    };
  };

  return {
    light: buildPalette("light"),
    dark: buildPalette("dark"),
  };
}
