/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const profileNames = ["solicitante", "analista", "administrador", "gestor"];

  const existingProfiles = await knex("profiles").select("name").whereIn("name", profileNames);

  const existingNames = existingProfiles.map((profile) => profile.name);

  const profilesToInsert = profileNames
    .filter((name) => !existingNames.includes(name))
    .map((name) => ({ name }));

  if (profilesToInsert.length > 0) {
    await knex("profiles").insert(profilesToInsert);
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex("profiles")
    .whereIn("name", ["solicitante", "analista", "administrador", "gestor"])
    .del();
}
