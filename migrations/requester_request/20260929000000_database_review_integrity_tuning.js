/**
 * Revisão do banco (issue #130) — rodada 2: defaults, largura de colunas,
 * índices e integridade. Complementa as migrations `20260927000000_*` e
 * `20260928000000_*`.
 *
 * 1. Defaults alinhados com a aplicação: usuários criados fora do fluxo da API
 *    devem exigir troca de senha, e status novo deve nascer ativo.
 * 2. Colunas de auditoria que recebem e-mail alargadas para varchar(254), o
 *    limite aceito pelo validador da aplicação.
 * 3. Índices redundantes removidos (o prefixo já é coberto por outro índice) e
 *    índices de padrões de consulta reais criados.
 * 4. CHECKs espelhando domínios fechados já validados na aplicação.
 * 5. FK de `mapping_participants.user_id` passa de SET NULL para RESTRICT: como
 *    participantes internos também gravam nome/e-mail, o SET NULL fazia o CHECK
 *    de "interno ou externo" continuar válido após a remoção do usuário.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "users" ALTER COLUMN "must_change_password" SET DEFAULT true');
  await knex.raw('ALTER TABLE "statuses" ALTER COLUMN "is_active" SET DEFAULT true');

  await knex.schema.alterTable("mappings", (table) => {
    table.string("created_by", 254).alter();
    table.string("updated_by", 254).alter();
  });
  await knex.schema.alterTable("pending_items", (table) => {
    table.string("created_by", 254).alter();
  });

  // O prefixo destes índices já é atendido por índices compostos/únicos.
  await knex.raw('DROP INDEX IF EXISTS "idx_mappings_request"');
  await knex.raw('DROP INDEX IF EXISTS "idx_pending_items_request"');
  await knex.raw('DROP INDEX IF EXISTS "idx_mapping_participants_mapping"');

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS "idx_requests_desired_deadline"
    ON "requests" ("desired_deadline")
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS "idx_mappings_request_created"
    ON "mappings" ("request_id", "created_at" DESC, "updated_at" DESC)
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS "idx_attachments_request_uploaded"
    ON "attachments" ("request_id", "uploaded_at")
  `);

  // `NOT VALID` + `VALIDATE` evita ACCESS EXCLUSIVE durante a varredura.
  await knex.raw(`
    ALTER TABLE "audit_history"
    ADD CONSTRAINT "ck_audit_history_change_origin"
    CHECK ("change_origin" IS NULL
        OR "change_origin" IN ('admin', 'system', 'internal', 'requester'))
    NOT VALID
  `);
  await knex.raw(`
    ALTER TABLE "audit_history"
    VALIDATE CONSTRAINT "ck_audit_history_change_origin"
  `);

  await knex.raw(`
    ALTER TABLE "requests"
    ADD CONSTRAINT "ck_requests_screening_result"
    CHECK ("screening_result" IS NULL
        OR "screening_result" IN ('elegivel', 'nao_elegivel'))
    NOT VALID
  `);
  await knex.raw('ALTER TABLE "requests" VALIDATE CONSTRAINT "ck_requests_screening_result"');

  await knex.raw(`
    ALTER TABLE "mapping_participants"
    DROP CONSTRAINT "mapping_participants_user_id_foreign"
  `);
  await knex.raw(`
    ALTER TABLE "mapping_participants"
    ADD CONSTRAINT "mapping_participants_user_id_foreign"
    FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw(`
    ALTER TABLE "mapping_participants"
    DROP CONSTRAINT "mapping_participants_user_id_foreign"
  `);
  await knex.raw(`
    ALTER TABLE "mapping_participants"
    ADD CONSTRAINT "mapping_participants_user_id_foreign"
    FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE SET NULL
  `);

  await knex.raw('ALTER TABLE "requests" DROP CONSTRAINT "ck_requests_screening_result"');
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "ck_audit_history_change_origin"');

  await knex.raw('DROP INDEX IF EXISTS "idx_attachments_request_uploaded"');
  await knex.raw('DROP INDEX IF EXISTS "idx_mappings_request_created"');
  await knex.raw('DROP INDEX IF EXISTS "idx_requests_desired_deadline"');

  await knex.raw(
    'CREATE INDEX "idx_mapping_participants_mapping" ON "mapping_participants" ("mapping_id")',
  );
  await knex.raw('CREATE INDEX "idx_pending_items_request" ON "pending_items" ("request_id")');
  await knex.raw('CREATE INDEX "idx_mappings_request" ON "mappings" ("request_id")');

  await knex.schema.alterTable("pending_items", (table) => {
    table.string("created_by", 100).alter();
  });
  await knex.schema.alterTable("mappings", (table) => {
    table.string("created_by", 100).alter();
    table.string("updated_by", 100).alter();
  });

  await knex.raw('ALTER TABLE "statuses" ALTER COLUMN "is_active" SET DEFAULT false');
  await knex.raw('ALTER TABLE "users" ALTER COLUMN "must_change_password" SET DEFAULT false');
}
