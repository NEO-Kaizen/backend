const OLD_PROFILE_NAME = "Gestor";
const NEW_PROFILE_NAME = "Visualizador";

/**
 * Renomeia o rótulo do Perfil-base de leitura de Gestor para Visualizador
 * (issue #218). A identidade `profile_id` e a composição de Permissões não
 * mudam.
 *
 * Snapshots históricos não são atualizados: Notas internas e eventos de
 * auditoria preservam o nome vigente no momento da escrita (ADR-0002).
 *
 * O rollback é simétrico. A migration bloqueia ambiguidade e colisão de nome,
 * inclusive com Perfil inativo, porque a seed 013 resolve perfis base por
 * `lower(name)` e não pode escolher entre homônimos.
 *
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  await renameProfile(knex, OLD_PROFILE_NAME, NEW_PROFILE_NAME, "Migração");
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
  await renameProfile(knex, NEW_PROFILE_NAME, OLD_PROFILE_NAME, "Rollback");
}

async function renameProfile(knex, fromName, toName, operation) {
  const matches = await knex("profiles")
    .where("is_root", false)
    .whereRaw("lower(name) = lower(?)", [fromName])
    .select("profile_id");

  if (matches.length === 0) {
    return;
  }

  if (matches.length > 1) {
    throw new Error(`${operation} bloqueada: mais de um Perfil não-root usa o nome "${fromName}".`);
  }

  const target = matches[0];
  const collision = await knex("profiles")
    .whereNot("profile_id", target.profile_id)
    .whereRaw("lower(name) = lower(?)", [toName])
    .first("profile_id");

  if (collision) {
    throw new Error(
      `${operation} bloqueada: já existe um Perfil com o nome "${toName}". ` +
        "Renomeie o homônimo antes de repetir a migration.",
    );
  }

  await knex("profiles")
    .where("profile_id", target.profile_id)
    .update({ name: toName, updated_at: knex.fn.now() });
}
