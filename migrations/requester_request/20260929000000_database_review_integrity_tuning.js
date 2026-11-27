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

const CHANGE_ORIGINS = ["user", "admin", "system", "requester", "manual", "internal", "self"];
const SCREENING_RESULTS = ["elegivel", "nao_elegivel"];

function inList(values) {
  return values.map((value) => `'${value}'`).join(", ");
}

async function assertDomain(knex, table, column, allowed, constraint) {
  const invalid = await knex(table).whereNotNull(column).whereNotIn(column, allowed).first(column);
  if (invalid) {
    throw new Error(
      `${constraint}: existe valor ${JSON.stringify(invalid[column])} em ${table}.${column} fora do domínio ${allowed.join(", ")}; normalize os dados antes de aplicar a migration.`,
    );
  }
}

async function addValidatedCheck(knex, table, name, expression) {
  await knex.raw(`
    ALTER TABLE "${table}"
    ADD CONSTRAINT "${name}"
    CHECK (${expression})
    NOT VALID
  `);
  await knex.raw(`ALTER TABLE "${table}" VALIDATE CONSTRAINT "${name}"`);
}

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
  // `idx_attachments_request (request_id)` é redundante com o novo
  // `idx_attachments_request_uploaded (request_id, uploaded_at)`.
  await knex.raw('DROP INDEX IF EXISTS "idx_attachments_request"');

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

  // Preflight: `VALIDATE` abortaria a migration se uma base já contiver valor
  // fora do domínio; falhar aqui dá uma mensagem acionável. `change_origin` não
  // tem índice, então a consulta faz um seq scan em `audit_history`: é uma
  // leitura com ACCESS SHARE (não bloqueia escrita), mas pode ser lenta em
  // tabelas grandes. Aplicar em janela de manutenção.
  await assertDomain(
    knex,
    "audit_history",
    "change_origin",
    CHANGE_ORIGINS,
    "ck_audit_history_change_origin",
  );
  await assertDomain(
    knex,
    "requests",
    "screening_result",
    SCREENING_RESULTS,
    "ck_requests_screening_result",
  );

  // `NOT VALID` + `VALIDATE` evita ACCESS EXCLUSIVE durante a varredura.
  await addValidatedCheck(
    knex,
    "audit_history",
    "ck_audit_history_change_origin",
    `"change_origin" IS NULL OR "change_origin" IN (${inList(CHANGE_ORIGINS)})`,
  );
  await addValidatedCheck(
    knex,
    "requests",
    "ck_requests_screening_result",
    `"screening_result" IS NULL OR "screening_result" IN (${inList(SCREENING_RESULTS)})`,
  );

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
  await knex.raw('CREATE INDEX "idx_attachments_request" ON "attachments" ("request_id")');

  await knex.raw(
    'CREATE INDEX "idx_mapping_participants_mapping" ON "mapping_participants" ("mapping_id")',
  );
  await knex.raw('CREATE INDEX "idx_pending_items_request" ON "pending_items" ("request_id")');
  await knex.raw('CREATE INDEX "idx_mappings_request" ON "mappings" ("request_id")');

  // Limitação: um e-mail de 101–254 caracteres gravado após o `up` faz o
  // estreitamento abaixo falhar; nesse caso, trunque/limpe o valor antes do
  // rollback.
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
