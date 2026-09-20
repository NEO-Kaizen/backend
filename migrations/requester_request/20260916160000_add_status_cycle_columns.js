/**
 * Estende o ciclo de vida dinâmico dos status (contrato `portal-config-api.md`,
 * seção "statuses"), refletindo as colunas de `PortalStatus` no banco:
 *
 * - `visibility` — enum nativo `status_visibility` (PUBLIC | INTERNAL);
 * - `closes_request` — se o status encerra a solicitação;
 * - `tone` — enum nativo `status_tone` (error | success | info | warning | neutral);
 * - `is_triage_exit` — se o status pode ser usado como saída da triagem.
 *
 * Backfill dos 17 status de referência (`202609100013_insert_reference_data`):
 * todos PUBLIC/info; `Solicitação enviada` → closes_request false; os terminais
 * `Concluído`/`Cancelado` → closes_request true (tone success/neutral). A parte
 * de triagem recebe `is_triage_exit` true para os nomes que representam saída
 * da etapa de triagem no contrato `contract-triage_03.md`.
 */
const STATUS_TONE_SUCCESS = "Concluído";
const STATUS_TONE_NEUTRAL = "Cancelado";
const TRIAGE_EXIT_NAMES = [
  "Pendente de informações",
  "Elegível",
  "Elegível para avaliação",
  "Backlog",
  "Direcionado para outra área",
  "Direcionada para outra área",
  "Fora do escopo",
  "Duplicada",
  "Cancelado",
  "Cancelada",
];

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
    table.boolean("is_triage_exit").notNullable().defaultTo(false);
  });

  await knex("statuses").where({ name: STATUS_TONE_SUCCESS }).update({
    closes_request: true,
    tone: "success",
  });
  await knex("statuses").where({ name: STATUS_TONE_NEUTRAL }).update({
    closes_request: true,
    tone: "neutral",
  });
  await knex("statuses")
    .whereIn("name", TRIAGE_EXIT_NAMES)
    .update({ is_triage_exit: true });
}

export async function down(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.dropColumn("visibility");
    table.dropColumn("closes_request");
    table.dropColumn("tone");
    table.dropColumn("is_triage_exit");
  });
  await knex.raw('DROP TYPE IF EXISTS "status_visibility"');
  await knex.raw('DROP TYPE IF EXISTS "status_tone"');
}
