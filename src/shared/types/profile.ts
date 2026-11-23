/**
 * Linhas da persistência de Perfis — retorno direto do Knex.
 *
 * A conversão para DTO acontece no service, que aplica `buildEffectivePermissions`
 * (ordem do catálogo e validação das concessões) antes de expor.
 */

/** Linha da tabela `profiles`. */
export interface ProfileRow {
  profile_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  is_root: boolean;
  is_assignable_triage: boolean;
  is_assignable_mapping: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Linha de `profiles` com a contagem de contas vinculadas (LEFT JOIN + GROUP BY). */
export interface ProfileWithUserCountRow extends ProfileRow {
  user_count: number;
}

/** Concessão persistida do Perfil — par chave + vínculo de `profile_permissions`. */
export interface ProfilePermissionRow {
  profile_id: number;
  permission_key: string;
  custody: string;
}

/**
 * Referência pública a um Perfil vigente: identidade estável + rótulo.
 *
 * `id` é `String(profiles.profile_id)` — a identidade estável, a mesma exposta
 * em `/profiles/:id` e aceita como `profileId` nas escritas de conta. `name` é
 * rótulo de exibição e nunca participa da autorização, que segue por Permissões
 * e Custódia.
 */
export interface ProfileReference {
  id: string;
  name: string;
}

/**
 * Snapshot histórico de Perfil. O nome fica congelado no momento do registro;
 * `id` é `null` quando o registro antigo guardou só o nome — nenhum ID é
 * inferido de um nome mutável.
 */
export interface ProfileSnapshot {
  id: string | null;
  name: string;
}

/** Referência de um Perfil vigente, a partir da linha `profiles`. */
export function toProfileReference(profileId: number, name: string): ProfileReference {
  return { id: String(profileId), name };
}

/** Snapshot de Perfil de uma nota interna (ID pode não ter sido registrado). */
export function toProfileSnapshot(profileId: number | null, name: string): ProfileSnapshot {
  return { id: profileId === null ? null : String(profileId), name };
}

/**
 * Snapshot de Perfil do ator de auditoria. `null` quando o evento não registrou
 * Perfil (ação de sistema ou evento anterior ao snapshot).
 */
export function toActorProfileSnapshot(
  profileId: number | null,
  name: string | null,
): ProfileReference | null {
  if (profileId === null || name === null) {
    return null;
  }
  return toProfileReference(profileId, name);
}
