/**
 * Snapshota o status_id das transições de Status e substitui a validação
 * baseada em xmin por uma correspondência estável.
 *
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  await knex.schema.alterTable("audit_history", (table) => {
    table
      .integer("status_id")
      .nullable()
      .references("status_id")
      .inTable("statuses")
      .onDelete("RESTRICT");
    table
      .integer("previous_status_id")
      .nullable()
      .references("status_id")
      .inTable("statuses")
      .onDelete("RESTRICT");
    table.specificType("transaction_id", "xid8").nullable();
    table.index(["entity_type", "entity_id", "status_id"], "idx_audit_history_request_status");
  });

  await knex.raw(
    "ALTER TABLE audit_history DISABLE TRIGGER trg_audit_history_prevent_update_delete",
  );

  await knex.raw(`
    UPDATE audit_history AS audit
    SET status_id = status.status_id
    FROM statuses AS status
    WHERE audit.entity_type = 'request'
      AND audit.action_type IN (
        'request.status_change',
        'request.override_status_admin',
        'request.triage'
      )
      AND (
        audit.new_value = status.name
        OR CASE
          WHEN left(ltrim(COALESCE(audit.new_value, '')), 1) IN ('{', '[')
          THEN audit.new_value::jsonb ->> 'status'
          ELSE NULL
        END = status.name
      )
  `);

  await knex.raw(`
    UPDATE audit_history AS audit
    SET previous_status_id = status.status_id
    FROM statuses AS status
    WHERE audit.entity_type = 'request'
      AND audit.action_type IN (
        'request.status_change',
        'request.override_status_admin',
        'request.triage'
      )
      AND (
        audit.previous_value = status.name
        OR CASE
          WHEN left(ltrim(COALESCE(audit.previous_value, '')), 1) IN ('{', '[')
          THEN audit.previous_value::jsonb ->> 'status'
          ELSE NULL
        END = status.name
      )
  `);

  await knex.raw(
    "ALTER TABLE audit_history ENABLE TRIGGER trg_audit_history_prevent_update_delete",
  );

  await knex.raw(`
    CREATE OR REPLACE FUNCTION enforce_request_status_audit()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      matching_audit_count integer;
    BEGIN
      IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
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
            AND audit.status_id = NEW.status_id
            AND audit.transaction_id = pg_current_xact_id();

        IF matching_audit_count <> 1 THEN
          RAISE EXCEPTION
            'request status change requires exactly one matching status audit';
        END IF;
      END IF;

      RETURN NULL;
    END;
    $$;
  `);
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
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
        ) THEN
          RAISE EXCEPTION
            'request status change requires audit in the same transaction';
        END IF;
      END IF;
      RETURN NULL;
    END;
    $$;
  `);

  await knex.schema.alterTable("audit_history", (table) => {
    table.dropIndex(["entity_type", "entity_id", "status_id"], "idx_audit_history_request_status");
    table.dropColumn("status_id");
    table.dropColumn("previous_status_id");
    table.dropColumn("transaction_id");
  });
}
