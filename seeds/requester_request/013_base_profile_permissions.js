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
 * O lookup é por `lower(name)` e feito antes do INSERT: a unicidade de nome é
 * um índice parcial (`uk_profiles_active_name_lower`, `WHERE is_active`), que
 * não serve de alvo para `onConflict("name")`. Um perfil base desativado é
 * encontrado e tem marca/flags regravadas — a seed nunca cria uma segunda
 * linha com o mesmo nome nem reativa a existente.
 *
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  for (const baseProfile of BASE_PROFILES) {
    const existing = await knex("profiles")
      .whereRaw("lower(name) = lower(?)", [baseProfile.profileName])
      .orderBy("profile_id", "asc")
      .first("profile_id");

    if (existing) {
      await knex("profiles").where({ profile_id: existing.profile_id }).update({
        is_root: baseProfile.isRoot,
        is_assignable_triage: baseProfile.isAssignableTriage,
        is_assignable_mapping: baseProfile.isAssignableMapping,
        updated_at: knex.fn.now(),
      });
      continue;
    }

    await knex("profiles").insert({
      name: baseProfile.profileName,
      is_root: baseProfile.isRoot,
      is_assignable_triage: baseProfile.isAssignableTriage,
      is_assignable_mapping: baseProfile.isAssignableMapping,
    });
  }

  const profiles = await knex("profiles").select("profile_id", "name");
  const profileIdByName = new Map(
    profiles.map((profile) => [profile.name.toLowerCase(), profile.profile_id]),
  );

  for (const baseProfile of BASE_PROFILES) {
    const profileId = profileIdByName.get(baseProfile.profileName.toLowerCase());

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
