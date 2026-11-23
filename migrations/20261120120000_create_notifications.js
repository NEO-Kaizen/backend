/**
 * Notificações in-app (RF20 — issue #157).
 *
 * A Notificação é uma projeção por destinatário criada na MESMA transação do
 * evento de negócio. `payload` guarda apenas a Allowlist do Evento;
 * `dedup_key` garante idempotência por evento + destinatário; `read_at` é o
 * registro da leitura.
 */
export async function up(knex) {
  await knex.schema.createTable("notifications", (table) => {
    table.uuid("notification_id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .integer("recipient_user_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");

    table.string("event_type", 50).notNullable();

    table
      .bigInteger("request_id")
      .notNullable()
      .references("request_id")
      .inTable("requests")
      .onDelete("CASCADE");

    table.jsonb("payload").notNullable();
    table.string("dedup_key", 255).notNullable().unique("uk_notifications_dedup_key");
    table.timestamp("read_at", { useTz: true });
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Lista por destinatário (mais recente primeiro) e contador de não lidas.
    table.index(["recipient_user_id", "created_at"], "idx_notifications_recipient_created");
    table.index(["recipient_user_id", "read_at"], "idx_notifications_recipient_read");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("notifications");
}
