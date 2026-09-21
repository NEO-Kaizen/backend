/**
 * Issue B (#108) — extensão de solicitante 1:1 com `users`.
 *
 * Adiciona vínculo opcional de `requesters` para `users` e relaxa as colunas
 * `area` e `manager_name` para `NULL`:
 *
 * - A extensão do usuário nasce com `area`/`manager_name` nulos (os dados de
 *   contato só fazem sentido no contexto de uma solicitação). `resolveRequesterId`
 *   sincroniza esses campos antes da primeira solicitação autenticada — o
 *   `POST /requests` continua exigindo `area` e `manager` no payload.
 * - O upsert anônimo por e-mail (`upsertRequester`) segue preenchendo os campos
 *   normalmente, pois vêm do payload obrigatório.
 *
 * Política de exclusão: `ON DELETE SET NULL` — apagar o usuário preserva o
 * snapshot público em `requesters` (mesmo padrão de `professional_id`,
 * `requester_user_id` e `system_settings.updated_by`).
 */
export async function up(knex) {
  await knex.schema.alterTable("requesters", (table) => {
    table.integer("user_id").nullable().references("user_id").inTable("users").onDelete("SET NULL");
  });

  await knex.schema.alterTable("requesters", (table) => {
    table.unique(["user_id"], { indexName: "uk_requesters_user" });
  });

  await knex.schema.alterTable("requesters", (table) => {
    table.string("area", 100).nullable().alter();
    table.string("manager_name", 150).nullable().alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("requesters", (table) => {
    table.dropUnique(["user_id"], "uk_requesters_user");
    table.dropColumn("user_id");
  });

  // Reverte o estado original seguramente: o `NOT NULL` só existe se todas as
  // linhas tiverem valor, então linhas vazias (extensões nunca usadas) são
  // preenchidas antes de re-impor a constraint.
  await knex("requesters").whereNull("area").update({ area: "" });
  await knex("requesters").whereNull("manager_name").update({ manager_name: "" });

  await knex.schema.alterTable("requesters", (table) => {
    table.string("area", 100).notNullable().alter();
    table.string("manager_name", 150).notNullable().alter();
  });
}
