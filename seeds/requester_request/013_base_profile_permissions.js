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
 * O Perfil Admin Root é a exceção: é identificado pela marca `is_root`, nunca
 * pelo nome (o Root pode renomeá-lo pela API). A seed não sobrescreve nome nem
 * `is_active` de linha existente e nunca tenta criar um segundo `is_root`.
 *
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  // Ids resolvidos NESTA execução (exists → update, senão insert). Um mapa
  // construído a partir de todos os perfis poderia colidir entre um perfil
  // base desativado e um customizado homônimo ativo e gravar no perfil errado.
  const profileIdByName = new Map();

  for (const baseProfile of BASE_PROFILES) {
    const profileKey = baseProfile.profileName.toLowerCase();

    if (baseProfile.isRoot) {
      const rootProfile = await knex("profiles").where("is_root", true).first("profile_id");

      if (rootProfile) {
        await knex("profiles").where({ profile_id: rootProfile.profile_id }).update({
          is_assignable_triage: baseProfile.isAssignableTriage,
          is_assignable_mapping: baseProfile.isAssignableMapping,
          updated_at: knex.fn.now(),
        });
        profileIdByName.set(profileKey, rootProfile.profile_id);
        continue;
      }

      const inserted = await knex("profiles")
        .insert({
          name: baseProfile.profileName,
          is_root: true,
          is_assignable_triage: baseProfile.isAssignableTriage,
          is_assignable_mapping: baseProfile.isAssignableMapping,
        })
        .returning("profile_id");

      profileIdByName.set(profileKey, inserted[0].profile_id);
      continue;
    }

    // Perfis não-root: o lookup por nome ignora a linha `is_root` para nunca
    // capturar um Perfil Admin Root renomeado.
    const existing = await knex("profiles")
      .whereRaw("lower(name) = lower(?)", [baseProfile.profileName])
      .where("is_root", false)
      .orderBy("profile_id", "asc")
      .first("profile_id");

    if (existing) {
      await knex("profiles").where({ profile_id: existing.profile_id }).update({
        is_assignable_triage: baseProfile.isAssignableTriage,
        is_assignable_mapping: baseProfile.isAssignableMapping,
        updated_at: knex.fn.now(),
      });
      profileIdByName.set(profileKey, existing.profile_id);
      continue;
    }

    const inserted = await knex("profiles")
      .insert({
        name: baseProfile.profileName,
        is_root: false,
        is_assignable_triage: baseProfile.isAssignableTriage,
        is_assignable_mapping: baseProfile.isAssignableMapping,
      })
      .returning("profile_id");

    profileIdByName.set(profileKey, inserted[0].profile_id);
  }

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
