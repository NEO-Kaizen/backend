/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex("profiles")
    .insert([
      { name: "solicitante" },
      { name: "analista" },
      { name: "administrador" },
      { name: "gestor" },
    ])
    .onConflict("name")
    .ignore();
}
