/**
 * Joins que resolvem o designado do mapeamento vigente de uma solicitação.
 *
 * Regra (RBAC § 5): a atribuição vigente vem da linha aberta mais recente de
 * `mappings`; antes de existir qualquer linha, vale a designação inicial de
 * `requests.mapping_professional_id`. Mapeamento concluído é histórico e não
 * autoriza.
 *
 * O fragmento espera que a tabela de solicitações seja referenciada como
 * `requests` (sem alias) e usa os aliases `current_mapping`, `mapping_dp` e
 * `mapping_user`; não combine com outros joins que usem esses nomes.
 */
export const CURRENT_MAPPING_ASSIGNEE_JOIN = `
  LEFT JOIN LATERAL (
    SELECT CASE
      WHEN EXISTS (
        SELECT 1
        FROM mappings AS any_mapping
        WHERE any_mapping.request_id = requests.request_id
          AND (requests.last_reopened_at IS NULL OR any_mapping.created_at >= requests.last_reopened_at)
      ) THEN (
        SELECT active_mapping.professional_id
        FROM mappings AS active_mapping
        WHERE active_mapping.request_id = requests.request_id
          AND (requests.last_reopened_at IS NULL OR active_mapping.created_at >= requests.last_reopened_at)
          AND active_mapping.is_concluded = FALSE
        ORDER BY active_mapping.created_at DESC, active_mapping.updated_at DESC
        LIMIT 1
      )
      ELSE requests.mapping_professional_id
    END AS professional_id
  ) AS current_mapping ON TRUE
  LEFT JOIN details_professional AS mapping_dp
    ON mapping_dp.professional_id = current_mapping.professional_id
  LEFT JOIN users AS mapping_user
    ON mapping_user.user_id = mapping_dp.user_id
`;
