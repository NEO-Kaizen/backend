/**
 * Novos eventos recebem snapshots de Status e são validados pelo xid8 da
 * transação. Eventos históricos permanecem inalterados (audit_history é
 * append-only) e seus IDs são derivados na leitura quando necessário.
 *
 * A garantia é transacional, não por operação lógica: savepoints compartilham
 * o mesmo xid e a trigger exige exatamente um evento correspondente para o
 * protocolo e Status de destino dentro da transação.
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
            AND audit.status_id = NEW.status_id
            AND audit.transaction_id = pg_current_xact_id()
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

        IF matching_audit_count <> 1 THEN
          RAISE EXCEPTION
            'request status change requires exactly one matching audit in the same transaction';
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
