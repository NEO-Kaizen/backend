/**
 * Estende o ciclo de vida dinâmico dos status (contrato `portal-config-api.md`,
 * seção "statuses"), refletindo as colunas de `PortalStatus` no banco:
 *
 * - `visibility` — enum nativo `status_visibility` (PUBLIC | INTERNAL);
 * - `closes_request` — se o status encerra a solicitação;
 * - `tone` — enum nativo `status_tone` (error | success | info | warning | neutral).
 *
 * Backfill dos 17 status de referência (`202609100013_insert_reference_data`):
 * todos PUBLIC/info; `Solicitação enviada` → closes_request false; os terminais
 * `Concluído`/`Cancelado` → closes_request true (tone success/neutral).
 */
const STATUS_TONE_SUCCESS = "Concluído";
const STATUS_TONE_NEUTRAL = "Cancelado";

export async function up(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table
      .enu("visibility", ["PUBLIC", "INTERNAL"], {
        useNative: true,
        enumName: "status_visibility",
      })
      .notNullable()
      .defaultTo("PUBLIC");
    table.boolean("closes_request").notNullable().defaultTo(false);
    table
      .enu("tone", ["error", "success", "info", "warning", "neutral"], {
        useNative: true,
        enumName: "status_tone",
      })
      .notNullable()
      .defaultTo("info");
  });

  await knex("statuses").where({ name: STATUS_TONE_SUCCESS }).update({
    closes_request: true,
    tone: "success",
  });
  await knex("statuses").where({ name: STATUS_TONE_NEUTRAL }).update({
    closes_request: true,
    tone: "neutral",
  });
}

export async function down(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.dropColumn("visibility");
    table.dropColumn("closes_request");
    table.dropColumn("tone");
  });
  await knex.raw('DROP TYPE IF EXISTS "status_visibility"');
  await knex.raw('DROP TYPE IF EXISTS "status_tone"');
}
