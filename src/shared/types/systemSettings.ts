/** Modo de abertura do portal — valores aceitos na coluna `access_mode`. */
export type PortalAccessMode = "PUBLIC" | "AUTHENTICATED";

/**
 * Linha da tabela `system_settings` — configuração global singleton.
 *
 * Retorno direto do Knex (colunas em snake_case, datas normalizadas pelo
 * PostgreSQL). O singleton é garantido no banco: `settings_id = 1` (PK + CHECK).
 */
export interface SystemSettingsRow {
  settings_id: number;
  access_mode: PortalAccessMode;
  allowed_colors: string[];
  logo_url: string | null;
  favicon_url: string | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date | null;
}
