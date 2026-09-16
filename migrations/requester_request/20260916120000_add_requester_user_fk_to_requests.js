/**
 * Issue #53 — vínculo opcional de `requests` para `users`.
 *
 * Solicitações públicas não possuem usuário (`requester_user_id = NULL`);
 * solicitações em modo autenticado (qualquer perfil: solicitante, analista,
 * gestor, administrador) vinculam a conta que as criou.
 *
 * Política de exclusão: `ON DELETE SET NULL` — apagar o usuário preserva a
 * solicitação e a rastreabilidade (o snapshot público continua em `requesters`
 * e o histórico em `created_by`), mesmo padrão de `professional_id` e
 * `system_settings.updated_by`.
 */
export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table
      .integer("requester_user_id")
      .nullable()
      .references("user_id")
      .inTable("users")
      .onDelete("SET NULL");
  });

  await knex.schema.alterTable("requests", (table) => {
    table.index("requester_user_id", "idx_requests_requester_user");
  });
}

export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS "idx_requests_requester_user"');

  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("requester_user_id");
  });
}
