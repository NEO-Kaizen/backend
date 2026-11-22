import type { Custody } from "../catalog/permissionCatalog.ts";

/**
 * Autoridade de conta — predicado puro da matriz de contas (contrato RBAC § 4.2).
 *
 * A autoridade de um Perfil é o conjunto de pares chave+vínculo que ele concede.
 * Quem gerencia contas gerencia Perfis **estritamente abaixo**: todo par do alvo
 * contido no conjunto do ator, com conjuntos diferentes. As flags de
 * Atribuibilidade não entram na comparação; a exceção do Admin Root é decidida
 * pela marca `is_root`, fora deste módulo.
 */

/** Par chave+vínculo de um Perfil, na forma da lista efetiva de Permissões. */
export interface AuthorityGrant {
  readonly key: string;
  readonly custody: Custody;
}

/** `all` contém `assigned`; os demais vínculos só contêm a si mesmos (§ 4.2). */
function custodyContains(actorCustody: Custody, targetCustody: Custody): boolean {
  if (actorCustody === targetCustody) {
    return true;
  }

  return actorCustody === "all" && targetCustody === "assigned";
}

function containsAll(
  targetGrants: readonly AuthorityGrant[],
  actorGrants: readonly AuthorityGrant[],
): boolean {
  const actorCustodyByKey = new Map(actorGrants.map((grant) => [grant.key, grant.custody]));

  return targetGrants.every((grant) => {
    const actorCustody = actorCustodyByKey.get(grant.key);

    return actorCustody !== undefined && custodyContains(actorCustody, grant.custody);
  });
}

/**
 * O alvo está estritamente abaixo do ator? Contenção de todos os pares do alvo
 * no conjunto do ator **e** conjuntos diferentes — autoridade igual também é
 * recusada.
 */
export function isAuthorityStrictlyBelow(
  targetGrants: readonly AuthorityGrant[],
  actorGrants: readonly AuthorityGrant[],
): boolean {
  return containsAll(targetGrants, actorGrants) && !containsAll(actorGrants, targetGrants);
}
