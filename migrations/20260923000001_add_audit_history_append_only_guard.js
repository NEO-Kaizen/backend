/**
 * Torna `audit_history` append-only no próprio banco (issue #113, revisão):
 * `is_immutable` era só um marcador — nada impedia UPDATE/DELETE/TRUNCATE.
 *
 * - triggers rejeitam qualquer UPDATE, DELETE ou TRUNCATE;
 * - INSERT segue funcionando (é o único caminho de escrita, via `recordAudit`);
 * - FK `user_id` muda de `ON DELETE SET NULL` para `RESTRICT`: usuário com
 *   histórico não pode ser apagado (o padrão do sistema é desativar via
 *   `is_active`), então `NULL` em `user_id` volta a significar sempre
 *   "ação de sistema".
 * - remove a coluna `is_immutable`: era só um marcador (nunca lido em código)
 *   e a imutabilidade real passa a ser garantida pelos triggers — manter a
 *   coluna sugeriria uma proteção que não existe.
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION prevent_audit_history_mutation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION
        'audit_history is append-only: % is not allowed',
        TG_OP;
    END;
    $$;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_audit_history_prevent_update_delete
    BEFORE UPDATE OR DELETE ON audit_history
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_history_mutation();
  `);

  await knex.raw(`
    CREATE TRIGGER trg_audit_history_prevent_truncate
    BEFORE TRUNCATE ON audit_history
    FOR EACH STATEMENT
    EXECUTE FUNCTION prevent_audit_history_mutation();
  `);

  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "audit_history_user_id_foreign"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "audit_history_user_id_foreign"
      FOREIGN KEY ("user_id") REFERENCES "users" ("user_id")
      ON DELETE RESTRICT
  `);

  await knex.raw('ALTER TABLE "audit_history" DROP COLUMN "is_immutable"');
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  await knex.raw(`
    ALTER TABLE "audit_history" DROP CONSTRAINT "audit_history_user_id_foreign"
  `);
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "audit_history_user_id_foreign"
      FOREIGN KEY ("user_id") REFERENCES "users" ("user_id")
      ON DELETE SET NULL
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_audit_history_prevent_truncate ON audit_history;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_audit_history_prevent_update_delete ON audit_history;
  `);

  await knex.raw(`DROP FUNCTION IF EXISTS prevent_audit_history_mutation();`);

  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD COLUMN "is_immutable" boolean NOT NULL DEFAULT true
  `);
}
