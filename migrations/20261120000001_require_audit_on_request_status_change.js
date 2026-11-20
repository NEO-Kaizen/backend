/**
 * Garante no banco que toda alteração real de status de uma solicitação
 * seja acompanhada de auditoria na mesma transação.
 *
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION enforce_request_status_audit()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        IF NOT EXISTS (
          SELECT 1
          FROM audit_history AS audit
          WHERE audit.entity_type = 'request'
            AND audit.entity_id = NEW.protocol
            AND audit.action_type IN (
              'request.status_change',
              'request.override_status_admin',
              'request.triage'
            )
            AND audit.xmin::text = txid_current()::text
        ) THEN
          RAISE EXCEPTION
            'request status change requires audit in the same transaction';
        END IF;
      END IF;

      RETURN NULL;
    END;
    $$;
  `);

  await knex.raw(`
    CREATE CONSTRAINT TRIGGER trg_requests_require_status_audit
    AFTER UPDATE OF status_id ON requests
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION enforce_request_status_audit()
  `);
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
  await knex.raw("DROP TRIGGER IF EXISTS trg_requests_require_status_audit ON requests");
  await knex.raw("DROP FUNCTION IF EXISTS enforce_request_status_audit()");
}
