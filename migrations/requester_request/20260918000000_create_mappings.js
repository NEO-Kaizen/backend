// Tabelas de mapeamento da fila (issue de endpoints de mapeamento).
// - `mappings` 1:N com requests (uma solicitação pode ter vários mapeamentos);
//   no máximo 1 registro aberto por solicitação (invariante garantida na
//   aplicação — ver issue).
// - `mapping_participants` participantes do mapeamento: internos (vinculados a
//   `users.user_id`) ou externos (nome/e-mail informados no payload).
//
// Executa após `20260917013250` (rename `professionals`→`details_professional`):
// as FKs abaixo dependem de `details_professional.professional_id` e de
// `users.user_id`. O knex ordena `./migrations` + `./migrations/requester_request`
// por timestamp — esta migration fica nesta pasta para rodar depois da rename.

export async function up(knex) {
  await knex.schema.createTable("mappings", (table) => {
    table.uuid("mapping_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .bigInteger("request_id")
      .notNullable()
      .references("request_id")
      .inTable("requests")
      .onDelete("CASCADE");
    table
      .uuid("professional_id")
      .nullable()
      .references("professional_id")
      .inTable("details_professional")
      .onDelete("SET NULL");

    // Contrato: `scheduledFor` ISO-8601 com offset — persistido em UTC
    // (timestamptz); o GET devolve com "Z".
    table.timestamp("scheduled_for", { useTz: true });
    // Contrato: `durationMinutes` inteiro, 15–480 (check abaixo).
    table.integer("duration_minutes");
    // Contrato: `modality` = "REMOTE" | "IN_PERSON".
    table.enu("modality", ["REMOTE", "IN_PERSON"], {
      useNative: true,
      enumName: "mapping_modality",
    });
    table.string("meeting_link", 500);
    table.string("location", 500);
    // Limite fechado na issue (coerente com `additional_notes`).
    table.string("notes", 2000);

    table.boolean("is_concluded").notNullable().defaultTo(false);
    table.timestamp("concluded_at", { useTz: true });

    table.string("created_by", 100).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.string("updated_by", 100);
    table.timestamp("updated_at", { useTz: true });
  });

  await knex.raw(
    "ALTER TABLE mappings ADD CONSTRAINT ck_mappings_duration_minutes " +
      "CHECK (duration_minutes IS NULL OR (duration_minutes >= 15 AND duration_minutes <= 480))",
  );

  await knex.schema.alterTable("mappings", (table) => {
    table.index("request_id", "idx_mappings_request");
    // Consulta do "mapeamento atual" (mais recente não concluído).
    table.index(["request_id", "is_concluded"], "idx_mappings_request_concluded");
  });

  await knex.schema.createTable("mapping_participants", (table) => {
    table.uuid("participant_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("mapping_id")
      .notNullable()
      .references("mapping_id")
      .inTable("mappings")
      .onDelete("CASCADE");
    // Participante interno: referência a users.user_id (nome/e-mail do cadastro).
    // Participante externo: user_id NULL, nome/e-mail informados no payload.
    table.integer("user_id").nullable().references("user_id").inTable("users").onDelete("SET NULL");
    table.string("name", 255);
    table.string("email", 255);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Um usuário não aparece duas vezes no mesmo mapeamento (NULLs distintos
    // no Postgres permitem vários externos).
    table.unique(["mapping_id", "user_id"], { indexName: "uk_mapping_participants_user" });
  });

  // Unicidade por e-mail (case-insensitive) entre externos/internos do mesmo
  // mapeamento — null não conflita (NULLs distintos).
  await knex.raw(
    "CREATE UNIQUE INDEX uk_mapping_participants_email " +
      "ON mapping_participants (mapping_id, lower(email))",
  );

  await knex.schema.alterTable("mapping_participants", (table) => {
    table.index("mapping_id", "idx_mapping_participants_mapping");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("mapping_participants");
  await knex.schema.dropTable("mappings");
  await knex.raw('DROP TYPE IF EXISTS "mapping_modality"');
}
