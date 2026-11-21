import { BASE_PROFILES } from "../../src/shared/catalog/baseProfiles.ts";

/**
 * Composição dos cinco perfis base com a matriz de referência (§ 4.1):
 * concessões (`profile_permissions`), marca de Admin Root e flags de
 * Atribuibilidade vêm do catálogo em código — nenhuma cópia aqui.
 *
 * Idempotente: insere o que falta e regrava marca/flags/concessões ao estado de
 * referência; `is_active` de linha existente nunca é alterado e concessões
 * fora da matriz não são removidas (não se apaga dado fora do escopo).
 *
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  for (const baseProfile of BASE_PROFILES) {
    await knex("profiles")
      .insert({
        name: baseProfile.profileName,
        is_root: baseProfile.isRoot,
        is_assignable_triage: baseProfile.isAssignableTriage,
        is_assignable_mapping: baseProfile.isAssignableMapping,
      })
      .onConflict("name")
      .merge({
        is_root: baseProfile.isRoot,
        is_assignable_triage: baseProfile.isAssignableTriage,
        is_assignable_mapping: baseProfile.isAssignableMapping,
        updated_at: knex.fn.now(),
      });
  }

  const profiles = await knex("profiles").select("profile_id", "name");
  const profileIdByName = new Map(profiles.map((profile) => [profile.name, profile.profile_id]));

  for (const baseProfile of BASE_PROFILES) {
    const profileId = profileIdByName.get(baseProfile.profileName);

    if (!profileId) {
      throw new Error(
        `Perfil '${baseProfile.profileName}' não encontrado após a inserção do seed.`,
      );
    }

    await knex("profile_permissions")
      .insert(
        baseProfile.permissions.map((permission) => ({
          profile_id: profileId,
          permission_key: permission.key,
          custody: permission.custody,
        })),
      )
      .onConflict(["profile_id", "permission_key"])
      .merge(["custody", "updated_at"]);
  }
}
