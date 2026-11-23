/**
 * Snapshot de Perfil do ator na trilha de auditoria + negações estruturadas
 * (issue #199).
 *
 * - `actor_profile_id` / `actor_profile_name`: o Perfil do ator **no momento do
 *   evento**. O nome fica congelado (renomear o Perfil não reescreve o
 *   histórico) e o ID é a identidade estável. `recordAudit` preenche as duas
 *   colunas a partir do `users.profile_id` do ator. Eventos gravados antes
 *   desta migration ficam `NULL`: nenhum Perfil é inferido do nome.
 * - `denied_permission_keys`: chaves exigidas e ausentes nas recusas
 *   (`*.access_denied`). Vazio nas demais ações — a chave que autorizou não é
 *   registrada. O `note` legível permanece.
 *
 * O `ON DELETE RESTRICT` acompanha a trilha append-only: Perfil nunca é excluído
 * fisicamente, e o histórico não pode perder a identidade que registrou.
 *
 * Rollback: as três colunas caem e o snapshot de Perfil/negações estruturadas
 * dos eventos novos é perdido. Os eventos continuam íntegros (`note` e
 * `user_id` intactos).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("audit_history", (table) => {
    table
      .integer("actor_profile_id")
      .nullable()
      .references("profile_id")
      .inTable("profiles")
      .onDelete("RESTRICT");
    table.string("actor_profile_name", 60).nullable();
  });

  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD COLUMN "denied_permission_keys" text[] NOT NULL DEFAULT '{}'
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("audit_history", (table) => {
    table.dropColumn("denied_permission_keys");
    table.dropColumn("actor_profile_name");
    table.dropColumn("actor_profile_id");
  });
}
