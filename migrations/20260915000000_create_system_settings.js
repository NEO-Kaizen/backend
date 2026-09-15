/**
 * Configuração global do portal — singleton (issue #54).
 *
 * Uma única linha (settings_id = 1) com colunas explícitas e defaults seguros:
 * - access_mode: enum nativo PUBLIC | AUTHENTICATED, default PUBLIC (comportamento
 *   atual do portal — cadastro e acompanhamento públicos);
 * - allowed_colors: JSONB array com a paleta do tema (default placeholder — ver
 *   docs/database/system-settings-persistence.md);
 * - logo_url / favicon_url: referências opcionais aos assets;
 * - updated_by: usuário/admin que alterou (FK para users, ON DELETE SET NULL).
 *
 * O singleton é garantido no banco por PK + CHECK (settings_id = 1): inserir uma
 * segunda linha falha seja por duplicação de PK, seja por violação do CHECK.
 *
 * Colunas em inglês snake_case (padrão do projeto).
 */
export async function up(knex) {
  // Default provisório da paleta do tema — tema real pendente de confirmação.
  const DEFAULT_ALLOWED_COLORS = knex.raw(`'["#0B3C5D", "#1D2733", "#F5F5F5", "#FFFFFF"]'::jsonb`);

  await knex.schema.createTable("system_settings", (table) => {
    table.smallint("settings_id").notNullable().defaultTo(1).primary();
    // useNative + enumName: cria o tipo PostgreSQL portal_access_mode uma única vez.
    table
      .enu("access_mode", ["PUBLIC", "AUTHENTICATED"], {
        useNative: true,
        enumName: "portal_access_mode",
      })
      .notNullable()
      .defaultTo("PUBLIC");
    table.jsonb("allowed_colors").notNullable().defaultTo(DEFAULT_ALLOWED_COLORS);
    table.string("logo_url", 500);
    table.string("favicon_url", 500);
    table.integer("updated_by").references("user_id").inTable("users").onDelete("SET NULL");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true });

    // knex 3.x: check(predicate, bindings, constraintName)
    table.check("settings_id = 1", undefined, "ck_system_settings_single_row");
    // PostgreSQL não aceita subquery em CHECK — a validação de que TODOS os
    // elementos são strings (array de cores) fica na camada de aplicação (Zod),
    // junto do futuro endpoint de atualização (ver docs). Aqui garantimos o tipo
    // externo (array).
    table.check(
      "jsonb_typeof(allowed_colors) = 'array'",
      undefined,
      "ck_system_settings_allowed_colors_array",
    );
  });

  // Registro padrão — garante "existe exatamente uma configuração" após
  // migrate:latest, sem depender de seed. Demais colunas usam os defaults.
  await knex("system_settings").insert({ settings_id: 1 });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("system_settings");
  // Aviso: o DROP TYPE abaixo só é seguro enquanto `portal_access_mode` for
  // exclusivo desta tabela. Se uma migration futura reutilizar o tipo, este
  // rollback precisará ser revisto (o PostgreSQL recusa DROP TYPE com
  // dependências) — caso já documentado em system-settings-persistence.md.
  await knex.raw('DROP TYPE IF EXISTS "portal_access_mode"');
}
