/**
 * Configuração global do portal — singleton (issues #54 e portal-config-api.md).
 *
 * O contrato `portal-config-api.md` é dividido em duas camadas de persistência:
 *
 * 1. `system_themes` — TABELA PRÓPRIA do tema (light/dark), com colunas
 *    EXPLÍCITAS por token (sem JSONB): tokens hex, gradiente e os 5 statuses
 *    (color/background/backgroundLocked) por paleta.
 * 2. `system_settings` — o restante do singleton: identity (platform_name,
 *    protocol_mask), access (solicitation_mode) e assets (URLs da parte visual),
 *    com FK para o tema vigente.
 *
 * `categories`, `statuses` e `prioritizationWeights` (criteria) ficam nas
 * tabelas próprias já existentes — NÃO entram aqui.
 *
 * O tema pode iniciar vazio (NULL): o contrato permite o backend iniciar sem
 * tema e o frontend aplica os defaults locais por token. Por isso
 * `system_settings.theme_id` aceita NULL.
 *
 * Padrão: colunas snake_case; cores hex VARCHAR(9) — CHECK `#RRGGBB` ou
 * `#RRGGBBAA`; singletons garantidos por PK + CHECK (= 1).
 */
const COLOR_TOKEN_KEYS = [
  "background",
  "surface",
  "border",
  "text_primary",
  "text_secondary",
  "rich_black",
  "primary",
  "secondary",
  "tint",
  "on_primary",
  "on_dark",
  "on_gradient",
];

const STATUS_TONES = ["error", "success", "info", "warning", "neutral"];

const PALETTE_PREFIXES = ["light", "dark"];

/** Colunas de cor (hex #RRGGBB ou #RRGGBBAA): tokens + gradiente + statuses. */
const hexColumns = [];
for (const prefix of PALETTE_PREFIXES) {
  for (const token of COLOR_TOKEN_KEYS) hexColumns.push(`${prefix}_${token}`);
  hexColumns.push(`${prefix}_gradient_from`, `${prefix}_gradient_to`);
  for (const tone of STATUS_TONES) {
    hexColumns.push(`${prefix}_status_${tone}_color`, `${prefix}_status_${tone}_background`);
  }
}

export async function up(knex) {
  // ---------------------------------------------------------------------------
  // 1. Tabela do tema — colunas explícitas por paleta (light/dark).
  // ---------------------------------------------------------------------------
  await knex.schema.createTable("system_themes", (table) => {
    table.smallint("theme_id").notNullable().defaultTo(1).primary();

    for (const prefix of PALETTE_PREFIXES) {
      for (const token of COLOR_TOKEN_KEYS) table.string(`${prefix}_${token}`, 9);
      table.string(`${prefix}_gradient_from`, 9);
      table.string(`${prefix}_gradient_to`, 9);
      table.integer(`${prefix}_gradient_angle`).defaultTo(143);
      for (const tone of STATUS_TONES) {
        table.string(`${prefix}_status_${tone}_color`, 9);
        table.string(`${prefix}_status_${tone}_background`, 9);
        table.boolean(`${prefix}_status_${tone}_background_locked`);
      }
    }

    table.timestamp("updated_at", { useTz: true });

    // knex 3.x: check(predicate, bindings, constraintName)
    table.check("theme_id = 1", undefined, "ck_system_themes_single_row");
  });

  // Cores hex #RRGGBB ou #RRGGBBAA (ou NULL quando o tema não está definido).
  // ATENÇÃO: knex.raw interpreta `?` como placeholder de binding — o regex usa
  // `|` na alternância e NUNCA `?` para não corromper a constraint.
  const hexPredicate = hexColumns
    .map((col) => `("${col}" IS NULL OR "${col}" ~ '^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$')`)
    .join(" AND ");
  await knex.raw(
    `ALTER TABLE "system_themes" ADD CONSTRAINT "ck_system_themes_theme_hex" CHECK (${hexPredicate})`,
  );

  // Ângulo do gradiente: 0..360 (ou NULL).
  const anglePredicate = PALETTE_PREFIXES.map(
    (prefix) =>
      `("${prefix}_gradient_angle" IS NULL OR "${prefix}_gradient_angle" BETWEEN 0 AND 360)`,
  ).join(" AND ");
  await knex.raw(
    `ALTER TABLE "system_themes" ADD CONSTRAINT "ck_system_themes_gradient_angle" CHECK (${anglePredicate})`,
  );

  // ---------------------------------------------------------------------------
  // 2. Resto do contrato no singleton system_settings — identity, access, assets.
  // ---------------------------------------------------------------------------
  await knex.schema.createTable("system_settings", (table) => {
    table.smallint("settings_id").notNullable().defaultTo(1).primary();
    // Access — solicitationMode do contrato (PUBLIC | AUTHENTICATED).
    table
      .enu("solicitation_mode", ["PUBLIC", "AUTHENTICATED"], {
        useNative: true,
        enumName: "portal_solicitation_mode",
      })
      .notNullable()
      .defaultTo("PUBLIC");
    // Identity — plataforma e máscara do protocolo.
    table.string("platform_name", 80).notNullable().defaultTo("MAAT");
    table.string("protocol_mask", 10).notNullable().defaultTo("MAAT");

    // Tema vigente (NULL = frontend aplica defaults locais; o tema mora na
    // tabela system_themes).
    table.smallint("theme_id").references("theme_id").inTable("system_themes").onDelete("SET NULL");

    // Assets — parte visual: uma URL/caminho por chave do contrato.
    table.string("logo_url", 500);
    table.string("avatar_url", 500);
    table.string("favicon_url", 500);
    table.string("login_image_url", 500);

    table.integer("updated_by").references("user_id").inTable("users").onDelete("SET NULL");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true });

    table.check("settings_id = 1", undefined, "ck_system_settings_single_row");
  });

  // Registros padrão — singleton. O tema nasce vazio (cores NULL) para o
  // frontend aplicar seus defaults locais por token (permitido pelo contrato);
  // system_settings aponta para o tema (theme_id = 1), mesmo sem cores.
  await knex("system_themes").insert({ theme_id: 1 });
  await knex("system_settings").insert({ settings_id: 1, theme_id: 1 });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("system_settings");
  await knex.schema.dropTableIfExists("system_themes");
  // Aviso: DROP TYPE seguro enquanto `portal_solicitation_mode` for exclusivo
  // desta migration — ver docs/database/system-settings-persistence.md.
  await knex.raw('DROP TYPE IF EXISTS "portal_solicitation_mode"');
}
