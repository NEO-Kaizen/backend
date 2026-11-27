/**
 * Expande os assets do portal para o contrato `portal-config-api2.md` (§5):
 * um par claro/escuro por tipo, mais o flag `logoUsePrimaryColor`.
 *
 * Antes  : logo_url | avatar_url | favicon_url | login_image_url
 * Depois : logo_light_url | logo_dark_url | logo_use_primary_color
 *          avatar_light_url | avatar_dark_url
 *          login_image_light_url | login_image_dark_url
 *          favicon_light_url | favicon_dark_url
 *
 * Backfill: valores existentes das colunas únicas são copiados para AMBAS as
 * variantes (light/dark) daquele tipo — o contrato define `*DarkUrl` vazio
 * como fallback para a variante clara, então copiar para as duas preserva o
 * asset vigente sem risco de perda. O flag `logoUsePrimaryColor` nasce false
 * (reproduz o comportamento atual: logo renderizado por completo, sem tint).
 */
const OLD_TO_NEW = [
  ["logo_url", "logo_light_url", "logo_dark_url"],
  ["avatar_url", "avatar_light_url", "avatar_dark_url"],
  ["login_image_url", "login_image_light_url", "login_image_dark_url"],
  ["favicon_url", "favicon_light_url", "favicon_dark_url"],
];

export async function up(knex) {
  for (const [, light, dark] of OLD_TO_NEW) {
    await knex.schema.alterTable("system_settings", (table) => {
      table.string(light, 500);
      table.string(dark, 500);
    });
  }

  await knex.schema.alterTable("system_settings", (table) => {
    table.boolean("logo_use_primary_color").notNullable().defaultTo(false);
  });

  // Backfill: copia o valor único vigente para as duas variantes.
  for (const [oldName, light, dark] of OLD_TO_NEW) {
    await knex.raw(
      `UPDATE "system_settings" SET "${light}" = "${oldName}", "${dark}" = "${oldName}" WHERE "${oldName}" IS NOT NULL`,
    );
  }

  // Remove as colunas antigas (o contrato api2 não as expõe mais).
  await knex.schema.alterTable("system_settings", (table) => {
    for (const [oldName] of OLD_TO_NEW) {
      table.dropColumn(oldName);
    }
  });
}

export async function down(knex) {
  // Restaura as colunas únicas a partir da variante clara.
  await knex.schema.alterTable("system_settings", (table) => {
    for (const [oldName] of OLD_TO_NEW) {
      table.string(oldName, 500);
    }
  });

  for (const [oldName, light] of OLD_TO_NEW) {
    await knex.raw(
      `UPDATE "system_settings" SET "${oldName}" = "${light}" WHERE "${light}" IS NOT NULL`,
    );
  }

  await knex.schema.alterTable("system_settings", (table) => {
    for (const [, light, dark] of OLD_TO_NEW) {
      table.dropColumn(light);
      table.dropColumn(dark);
    }
    table.dropColumn("logo_use_primary_color");
  });
}
