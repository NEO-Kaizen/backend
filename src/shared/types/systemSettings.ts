/** Modo de abertura do portal — `solicitation_mode` do contrato. */
export type PortalSolicitationMode = "PUBLIC" | "AUTHENTICATED";

/**
 * Linha da tabela `system_settings` — configuração global singleton (contrato
 * `portal-config-api.md`).
 *
 * Retorno direto do Knex (colunas em snake_case, datas normalizadas pelo
 * PostgreSQL). O singleton é garantido no banco: `settings_id = 1` (PK + CHECK).
 *
 * Mantém APENAS o que não vive em tabela própria:
 * - identity (`platform_name`/`protocol_mask`) e access (`solicitation_mode`);
 * - temas: FK `theme_id` → `system_themes` (ver `SystemThemeRow`);
 * - assets (`logo_url`, `avatar_url`, `favicon_url`, `login_image_url`);
 * - `categories`, `statuses` e `prioritizationWeights` ficam nas tabelas
 *   próprias (`categories`, `statuses`, `criteria`).
 */
export interface SystemSettingsRow {
  settings_id: number;
  platform_name: string;
  solicitation_mode: PortalSolicitationMode;
  protocol_mask: string;
  theme_id: number | null;
  logo_url: string | null;
  avatar_url: string | null;
  favicon_url: string | null;
  login_image_url: string | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date | null;
}
