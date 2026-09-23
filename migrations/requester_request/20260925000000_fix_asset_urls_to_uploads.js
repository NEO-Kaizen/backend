/**
 * Corrige URLs de asset do portal: a migration 20260924000000 escreveu
 * `/assets/*` (sem mount no Express nem proxy no Vite), mas o único prefixo
 * servido é `/uploads/portal/*` (app.ts:23 + vite.config.ts:26).
 *
 * - `system_settings.logo_*_url` / `avatar_*` / `login_image_*` / `favicon_*`
 *   com `/assets/%` ou NULL/vazio → `/uploads/portal/*-default.*` (arquivos já
 *   copiados por ensureDefaultAssets em uploads/portal).
 * - Destinos coincidem com DEFAULT_ASSETS de ensureDefaultAssets.
 */

const ASSET_FIX = [
  ["logo_light_url", "/uploads/portal/logo-light-default.svg"],
  ["logo_dark_url", "/uploads/portal/logo-dark-default.svg"],
  ["avatar_light_url", "/uploads/portal/avatar-light-default.svg"],
  ["avatar_dark_url", "/uploads/portal/avatar-dark-default.svg"],
  ["login_image_light_url", "/uploads/portal/login-light-default.png"],
  ["login_image_dark_url", "/uploads/portal/login-dark-default.png"],
  ["favicon_light_url", "/uploads/portal/favicon-light-default.svg"],
  ["favicon_dark_url", "/uploads/portal/favicon-dark-default.svg"],
];

export async function up(knex) {
  const hasSystemSettings = await knex.schema.hasTable("system_settings");
  if (!hasSystemSettings) return;

  for (const [column, url] of ASSET_FIX) {
    const hasCol = await knex.schema.hasColumn("system_settings", column);
    if (!hasCol) continue;
    // Corrige NULL, vazio, ou legado /assets/*
    await knex("system_settings")
      .where({ settings_id: 1 })
      .andWhere((qb) => {
        qb.whereNull(column).orWhere(column, "").orWhere(column, "like", "/assets/%");
      })
      .update({ [column]: url });
  }
}

export async function down(knex) {
  // Reverter ao legado /assets (não recomendado; só para rollback)
  const legacy = [
    ["logo_light_url", "/assets/MAAT-logo.svg"],
    ["logo_dark_url", "/assets/MAAT-logo.svg"],
    ["avatar_light_url", "/assets/avatar-default.svg"],
    ["avatar_dark_url", "/assets/avatar-default.svg"],
    ["login_image_light_url", "/assets/login.png"],
    ["login_image_dark_url", "/assets/loginDark.png"],
    ["favicon_light_url", "/assets/favicon.svg"],
    ["favicon_dark_url", "/assets/favicon.svg"],
  ];
  for (const [column, url] of legacy) {
    const hasCol = await knex.schema.hasColumn("system_settings", column);
    if (!hasCol) continue;
    await knex("system_settings")
      .where({ settings_id: 1 })
      .andWhere((qb) => qb.where(column, "like", "/uploads/portal/%-default.%"))
      .update({ [column]: url });
  }
}
