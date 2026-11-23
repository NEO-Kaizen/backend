const BASE_PROFILE_NAMES = [
  { oldName: "solicitante", displayName: "Solicitante" },
  { oldName: "analista", displayName: "Analista" },
  { oldName: "gestor", displayName: "Gestor" },
  { oldName: "administrador", displayName: "Administrador" },
];

/**
 * Base Profile names are consumed directly as display labels by the API.
 * Admin Root is identified by `is_root`, and is renamed only when it still has
 * its original seed name.
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  for (const { oldName, displayName } of BASE_PROFILE_NAMES) {
    const matches = await knex("profiles")
      .where({ name: oldName, is_root: false })
      .select("profile_id");

    if (matches.length > 1) {
      throw new Error(
        `Migração bloqueada: mais de um Perfil não-root usa o nome base "${oldName}".`,
      );
    }

    if (matches[0]) {
      await knex("profiles")
        .where({ profile_id: matches[0].profile_id })
        .update({ name: displayName, updated_at: knex.fn.now() });
    }
  }

  await knex("profiles")
    .where({ name: "admin_root", is_root: true })
    .update({ name: "Admin Root", updated_at: knex.fn.now() });
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  for (const { oldName, displayName } of BASE_PROFILE_NAMES) {
    const matches = await knex("profiles")
      .where({ is_root: false })
      .whereRaw("lower(name) = lower(?)", [displayName])
      .select("profile_id");

    if (matches.length > 1) {
      throw new Error(
        `Rollback bloqueado: mais de um Perfil não-root usa o rótulo "${displayName}".`,
      );
    }

    if (matches[0]) {
      await knex("profiles")
        .where({ profile_id: matches[0].profile_id })
        .update({ name: oldName, updated_at: knex.fn.now() });
    }
  }

  await knex("profiles")
    .where({ name: "Admin Root", is_root: true })
    .update({ name: "admin_root", updated_at: knex.fn.now() });
}
