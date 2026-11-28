/**
 * Backfill das dependências de chave da § 1.7 (Rodada 01 do RBAC).
 *
 * O catálogo passou a exigir `request:create` → `request:track`,
 * `request:assign` → `assignee_directory:read` e `user:manage` →
 * `profile:read`. Perfis criados antes da mudança têm a chave principal sem a
 * dependência e ficariam inválidos para `validateComposition` — inclusive nas
 * leituras de sessão, que reconstroem a composição pelo catálogo.
 *
 * A migration é aditiva e idempotente: `NOT EXISTS` + `ON CONFLICT DO
 * NOTHING` contra o índice único `(profile_id, permission_key)`. Cada
 * dependência é concedida com o vínculo que a chave aceita (`request:track` em
 * `own`, as globais em `global`).
 *
 * Rollback: no-op deliberado. As concessões são aditivas e benéficas
 * isoladamente; removê-las quebraria perfis legítimos, e não há como
 * distinguir o que esta migration criou do que já existia sem uma tabela de
 * log. A execução só concede chaves — nunca remove.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // request:create -> request:track (posse fixa em `own`)
  await knex.raw(`
    INSERT INTO profile_permissions (profile_id, permission_key, custody)
    SELECT DISTINCT pp.profile_id, 'request:track', 'own'
    FROM profile_permissions pp
    WHERE pp.permission_key = 'request:create'
      AND NOT EXISTS (
        SELECT 1 FROM profile_permissions x
        WHERE x.profile_id = pp.profile_id
          AND x.permission_key = 'request:track'
      )
    ON CONFLICT (profile_id, permission_key) DO NOTHING
  `);

  // request:assign -> assignee_directory:read (global)
  await knex.raw(`
    INSERT INTO profile_permissions (profile_id, permission_key, custody)
    SELECT DISTINCT pp.profile_id, 'assignee_directory:read', 'global'
    FROM profile_permissions pp
    WHERE pp.permission_key = 'request:assign'
      AND NOT EXISTS (
        SELECT 1 FROM profile_permissions x
        WHERE x.profile_id = pp.profile_id
          AND x.permission_key = 'assignee_directory:read'
      )
    ON CONFLICT (profile_id, permission_key) DO NOTHING
  `);

  // user:manage -> profile:read (global)
  await knex.raw(`
    INSERT INTO profile_permissions (profile_id, permission_key, custody)
    SELECT DISTINCT pp.profile_id, 'profile:read', 'global'
    FROM profile_permissions pp
    WHERE pp.permission_key = 'user:manage'
      AND NOT EXISTS (
        SELECT 1 FROM profile_permissions x
        WHERE x.profile_id = pp.profile_id
          AND x.permission_key = 'profile:read'
      )
    ON CONFLICT (profile_id, permission_key) DO NOTHING
  `);
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
