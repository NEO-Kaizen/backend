/**
 * Remoção das chaves `form:read` e `form:manage` do RBAC.
 *
 * As duas chaves não têm rota nem consumidor e não terão neste ciclo. Como
 * `buildEffectivePermissions` falha alto para chave fora do catálogo, deixar
 * as concessões em `profile_permissions` quebraria a sessão (`/auth/me` e
 * login) dos perfis que as receberam — os perfis base Administrador e Admin
 * Root, semeados com todas as chaves.
 *
 * Rollback: no-op deliberado. Recriar as concessões exigiria saber quais
 * perfis as tinham; o estado anterior era justamente o que esta migration
 * remove. Um rollback de código deve ser acompanhado da migration anterior, não
 * desta.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex("profile_permissions").whereIn("permission_key", ["form:read", "form:manage"]).del();
}

/**
 * Rollback não reversível por decisão de contrato: ver o bloco de `up`.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down() {
  // No-op deliberado: ver a justificativa no bloco de `up`.
}
