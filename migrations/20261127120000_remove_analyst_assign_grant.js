/**
 * Remove `request:assign` do Perfil base Analista.
 *
 * Decisão de contrato: atribuir o Responsável é ação de Administrador/Admin
 * Root. O Analista mantém `assignee_directory:read` (leitura do diretório),
 * mas não escolhe nem troca o Responsável.
 *
 * O seed de composição (`014_base_profile_permissions.js`) insere/atualiza as
 * concessões da matriz e não remove concessões fora dela; por isso a remoção
 * precisa desta migration para alcançar bancos já semeados.
 *
 * Rollback: no-op deliberado. Recriar a concessão exigiria saber quais perfis a
 * tinham por composição própria; o estado anterior era justamente o que esta
 * migration corrige.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const profiles = await knex("profiles")
    .where({ is_root: false })
    .andWhereRaw("lower(name) = lower(?)", ["analista"])
    .select("profile_id");

  if (profiles.length === 0) return;

  await knex("profile_permissions")
    .whereIn(
      "profile_id",
      profiles.map((profile) => profile.profile_id),
    )
    .andWhere("permission_key", "request:assign")
    .del();
}

/**
 * Rollback não reversível por decisão de contrato: ver o bloco de `up`.
 *
 * @returns { Promise<void> }
 */
export async function down() {
  // No-op deliberado: ver a justificativa no bloco de `up`.
}
