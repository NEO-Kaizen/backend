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
