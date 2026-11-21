/**
 * Garante no banco que toda alteração real de status de uma solicitação
 * seja acompanhada de auditoria na mesma transação.
 *
 * Limitação: xmin identifica os registros inseridos pela transação atual;
 * savepoints não criam um novo xid e a garantia deixa de ser suficiente
 * caso a operação use transação diferente da gravação da auditoria.
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
    DECLARE
      target_status_name text;
      matching_audit_count integer;
    BEGIN
      IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        SELECT s.name
          INTO target_status_name
          FROM statuses AS s
          WHERE s.status_id = NEW.status_id;

        SELECT count(*)::integer
          INTO matching_audit_count
          FROM audit_history AS audit
          WHERE audit.entity_type = 'request'
            AND audit.entity_id = NEW.protocol
            AND audit.action_type IN (
              'request.status_change',
              'request.override_status_admin',
              'request.triage'
            )
            AND audit.xmin = txid_current()::xid
            AND (
              audit.new_value = target_status_name
              OR (
                left(ltrim(audit.new_value), 1) IN ('{', '[')
                AND CASE
                  WHEN audit.new_value IS NULL THEN NULL
                  ELSE audit.new_value::jsonb ->> 'status'
                END = target_status_name
              )
            );

        IF NOT EXISTS (
          SELECT 1 WHERE matching_audit_count = 1
        ) THEN
          RAISE EXCEPTION
            'request status change requires exactly one matching audit in the same transaction';
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
