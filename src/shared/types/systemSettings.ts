import type { SolicitationMode } from "./portalConfig.ts";

/** Modo de abertura do portal — `solicitation_mode` do contrato. */
export type PortalSolicitationMode = SolicitationMode;

/**
 * Linha da tabela `system_settings` — configuração global singleton (regras em
 * `docs/rules/portal-config.md`).
 *
 * Retorno direto do Knex (colunas em snake_case, datas normalizadas pelo
 * PostgreSQL). O singleton é garantido no banco: `settings_id = 1` (PK + CHECK).
 *
 * Mantém APENAS o que não vive em tabela própria:
 * - identity (`platform_name`/`protocol_mask`) e access (`solicitation_mode`);
 * - temas: FK `theme_id` → `system_themes` (ver `SystemThemeRow`);
 * - assets (8 variantes claro/escuro + flag `logo_use_primary_color`);
 * - `categories`, `statuses` e `prioritizationWeights` ficam nas tabelas
 *   próprias (`categories`, `statuses`, `criteria`).
 */
export interface SystemSettingsRow {
  settings_id: number;
  platform_name: string;
  solicitation_mode: SolicitationMode;
  protocol_mask: string;
  duplicate_detection_enabled: boolean;
  duplicate_completed_window_months: number;
  theme_id: number | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  logo_use_primary_color: boolean;
  avatar_light_url: string | null;
  avatar_dark_url: string | null;
  login_image_light_url: string | null;
  login_image_dark_url: string | null;
  favicon_light_url: string | null;
  favicon_dark_url: string | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date | null;
}
