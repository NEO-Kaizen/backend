/**
 * Adiciona a coluna `is_triage_exit` e os status de saída da triagem
 * (contrato `contract-triage_03.md`).
 *
 * A coluna NÃO foi adicionada em `202609100004_create_statuses` nem em
 * `20260916160000_add_status_cycle_columns` — manter as migrations originais
 * íntegras para bancos limpos (ver PR #92). Esta migration concentra:
 *
 * 1. Coluna `is_triage_exit` (boolean, default false);
 * 2. Status 18–22 (saídas da triagem) com `onConflict("status_id").ignore()`
 *    para coexistir com bancos que já receberam os inserts via seed/PR;
 * 3. Backfill `is_triage_exit = true` para os status que representam saída
 *    de triagem (por nome, idempotente).
 */

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

const STATUS_18_22 = [
  {
    status_id: 18,
    order_number: 18,
    name: "Elegível para avaliação",
    description: "Demanda elegível para seguir a próxima etapa de avaliação",
    is_final: false,
  },
  {
    status_id: 19,
    order_number: 19,
    name: "Fora do escopo",
    description: "Solicitação fora do escopo do NEO",
    is_final: true,
  },
  {
    status_id: 20,
    order_number: 20,
    name: "Direcionada para outra área",
    description: "Encaminhada para outra área de negócio ou suporte",
    is_final: true,
  },
  {
    status_id: 21,
    order_number: 21,
    name: "Duplicada",
    description: "Solicitação duplicada de outra demanda",
    is_final: true,
  },
  {
    status_id: 22,
    order_number: 22,
    name: "Cancelada",
    description: "Solicitação cancelada durante a triagem",
    is_final: true,
  },
];

export async function up(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.boolean("is_triage_exit").notNullable().defaultTo(false);
  });

  await knex("statuses").insert(STATUS_18_22).onConflict("status_id").ignore();

  await knex("statuses").whereIn("name", TRIAGE_EXIT_NAMES).update({ is_triage_exit: true });

  await knex.raw(
    "SELECT setval('statuses_status_id_seq', (SELECT COALESCE(MAX(status_id), 1) FROM statuses))",
  );
}

export async function down(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.dropColumn("is_triage_exit");
  });

  await knex("statuses")
    .whereIn(
      "status_id",
      STATUS_18_22.map((status) => status.status_id),
    )
    .del();
}
