/**
 * O snapshot de Perfil da Nota interna passa a ser texto livre pelo nome da
 * época: a constraint que o travava em nomes fixos sai. A coluna permanece
 * como snapshot histórico (contrato RBAC § 4 — renome e histórico).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(
    "ALTER TABLE request_internal_notes DROP CONSTRAINT ck_request_internal_notes_author_role",
  );
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw(`
    ALTER TABLE request_internal_notes
    ADD CONSTRAINT ck_request_internal_notes_author_role
    CHECK (author_role_at_creation IN ('Analista', 'Gestor', 'Administrador'))
  `);
}
