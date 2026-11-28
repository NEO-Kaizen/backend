/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.uuid("closure_ref").nullable();
  });

  // Os IDs 16 e 17 são os status core Concluído e Cancelado.
  await knex("requests")
    .whereIn("status_id", [16, 17])
    .update({ closure_ref: knex.raw("gen_random_uuid()") });

  await knex.raw(`
    CREATE FUNCTION maintain_request_closure_ref()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.status_id NOT IN (16, 17) THEN
        NEW.closure_ref := NULL;
      ELSIF TG_OP = 'INSERT' OR NEW.status_id IS DISTINCT FROM OLD.status_id THEN
        NEW.closure_ref := gen_random_uuid();
      ELSE
        NEW.closure_ref := OLD.closure_ref;
      END IF;

      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER trg_requests_maintain_closure_ref
    BEFORE INSERT OR UPDATE OF status_id, closure_ref ON requests
    FOR EACH ROW EXECUTE FUNCTION maintain_request_closure_ref();
  `);
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
  await knex.raw("DROP TRIGGER trg_requests_maintain_closure_ref ON requests");
  await knex.raw("DROP FUNCTION maintain_request_closure_ref()");
  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("closure_ref");
  });
}
