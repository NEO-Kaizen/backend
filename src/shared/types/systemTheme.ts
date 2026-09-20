/** Tons visuais dos status do tema — espelho do `STATUS_TONES` do contrato. */
export const STATUS_TONES = ["error", "success", "info", "warning", "neutral"] as const;
export type StatusTone = (typeof STATUS_TONES)[number];

/** Tokens de cor da paleta — espelho do `THEME_TOKEN_KEYS` do contrato. */
export const THEME_TOKEN_KEYS = [
  "background",
  "surface",
  "border",
  "text_primary",
  "text_secondary",
  "heading",
  "rich_black",
  "primary",
  "secondary",
  "tint",
  "on_primary",
  "on_dark",
  "on_gradient",
] as const;
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

/** Prefixo das paletas — light e dark. */
export type ThemePalette = "light" | "dark";

/**
 * Linha da tabela `system_themes` — tema do portal (contrato
 * `portal-config-api.md`), TABELA PRÓPRIA, fora do `system_settings`.
 *
 * Colunas explícitas por paleta (sem JSONB): tokens hex, gradiente e os 5
 * statuses por tom na paleta `light` e `dark`. Singleton (`theme_id = 1`).
 *
 * Cores hex `#RRGGBB` ou `#RRGGBBAA` (VARCHAR(9)); `NULL` quando o tema ainda
 * não foi definido — o frontend aplica os defaults locais por token.
 */
export interface SystemThemeRow {
  theme_id: number;
  // light palette
  light_background: string | null;
  light_surface: string | null;
  light_border: string | null;
  light_text_primary: string | null;
  light_text_secondary: string | null;
  light_heading: string | null;
  light_rich_black: string | null;
  light_primary: string | null;
  light_secondary: string | null;
  light_tint: string | null;
  light_on_primary: string | null;
  light_on_dark: string | null;
  light_on_gradient: string | null;
  light_gradient_from: string | null;
  light_gradient_to: string | null;
  light_gradient_angle: number | null;
  light_status_error_color: string | null;
  light_status_error_background: string | null;
  light_status_error_background_locked: boolean | null;
  light_status_success_color: string | null;
  light_status_success_background: string | null;
  light_status_success_background_locked: boolean | null;
  light_status_info_color: string | null;
  light_status_info_background: string | null;
  light_status_info_background_locked: boolean | null;
  light_status_warning_color: string | null;
  light_status_warning_background: string | null;
  light_status_warning_background_locked: boolean | null;
  light_status_neutral_color: string | null;
  light_status_neutral_background: string | null;
  light_status_neutral_background_locked: boolean | null;
  // dark palette
  dark_background: string | null;
  dark_surface: string | null;
  dark_border: string | null;
  dark_text_primary: string | null;
  dark_text_secondary: string | null;
  dark_heading: string | null;
  dark_rich_black: string | null;
  dark_primary: string | null;
  dark_secondary: string | null;
  dark_tint: string | null;
  dark_on_primary: string | null;
  dark_on_dark: string | null;
  dark_on_gradient: string | null;
  dark_gradient_from: string | null;
  dark_gradient_to: string | null;
  dark_gradient_angle: number | null;
  dark_status_error_color: string | null;
  dark_status_error_background: string | null;
  dark_status_error_background_locked: boolean | null;
  dark_status_success_color: string | null;
  dark_status_success_background: string | null;
  dark_status_success_background_locked: boolean | null;
  dark_status_info_color: string | null;
  dark_status_info_background: string | null;
  dark_status_info_background_locked: boolean | null;
  dark_status_warning_color: string | null;
  dark_status_warning_background: string | null;
  dark_status_warning_background_locked: boolean | null;
  dark_status_neutral_color: string | null;
  dark_status_neutral_background: string | null;
  dark_status_neutral_background_locked: boolean | null;
  // auditoria
  updated_at: Date | null;
}
