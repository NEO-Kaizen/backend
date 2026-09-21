/**
 * Issue #125 — Tela "Meus dados"
 *
 * Adiciona `avatar_url` em `users` para persistir a URL da foto de perfil
 * do usuário autenticado. O arquivo físico é salvo em `uploads/avatars/`
 * (via `saveFiles`, padrão portal) e a URL `/uploads/avatars/<chave>` é
 * persistida aqui. Coluna nullable: usuários sem foto (majoritariamente
 * legado) mantêm `NULL`.
 *
 * Down: drop da coluna (dados de foto ficam órfãos no disco — decisão
 * MVP; limpeza em issue futura se necessário).
 */
export async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.string("avatar_url", 500).nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("avatar_url");
  });
}
