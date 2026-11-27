/**
 * Adiciona o token `heading` (cor dos títulos h1–h6) às paletas do tema —
 * contrato `portal-config-api-0_4.md` (§Tipos, `THEME_TOKEN_KEYS` e §4 PATCH
 * /theme). Colunas `light_heading` / `dark_heading` em `system_themes`, hex
 * `#RRGGBB`/`#RRGGBBAA`, NULL enquanto o tema não define o token (o frontend
 * aplica o default local por token).
 *
 * A migration base `20260915000000_create_system_settings` criou o CHECK
 * `ck_system_themes_theme_hex` sem `heading`; aqui adicionamos um CHECK
 * dedicado apenas às novas colunas (defesa em profundidade sobre a validação
 * de hex já feita no schema Zod da API).
 */
const HEADING_COLUMNS = ["light_heading", "dark_heading"];

export async function up(knex) {
  await knex.schema.alterTable("system_themes", (table) => {
    for (const column of HEADING_COLUMNS) table.string(column, 9);
  });

  const predicate = HEADING_COLUMNS.map(
    (column) => `("${column}" IS NULL OR "${column}" ~ '^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$')`,
  ).join(" AND ");

  await knex.raw(
    `ALTER TABLE "system_themes" ADD CONSTRAINT "ck_system_themes_heading_hex" CHECK (${predicate})`,
  );
}

export async function down(knex) {
  await knex.raw(
    'ALTER TABLE "system_themes" DROP CONSTRAINT IF EXISTS "ck_system_themes_heading_hex"',
  );
  await knex.schema.alterTable("system_themes", (table) => {
    for (const column of HEADING_COLUMNS) table.dropColumn(column);
  });
}
