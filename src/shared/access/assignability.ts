import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { ASSIGNABILITY_PREDICATES, type PermissionKey } from "../catalog/permissionCatalog.ts";

/**
 * Atribuibilidade (§ 1.4 do contrato RBAC): a flag do Perfil **e** o predicado
 * de chaves de trabalho. A flag sozinha não basta, e ter as chaves também não.
 */
export type AssignabilityStage = "triage" | "mapping";

/** Predicado SQL: o Perfil possui todas as chaves informadas. */
export function hasAllPermissionKeysPredicate(
  profileIdExpression: string,
  keys: readonly PermissionKey[],
) {
  const placeholders = keys.map(() => "?").join(", ");

  return {
    sql: `(SELECT COUNT(DISTINCT pp.permission_key) FROM profile_permissions AS pp WHERE pp.profile_id = ${profileIdExpression} AND pp.permission_key IN (${placeholders})) = ?`,
    bindings: [...keys, keys.length],
  };
}

/** Perfis ativos atribuíveis em triagem ou mapeamento (flag + predicado). */
export async function findAssignableProfileIds(queryable: Knex = db): Promise<number[]> {
  const triagePredicate = hasAllPermissionKeysPredicate(
    "p.profile_id",
    ASSIGNABILITY_PREDICATES.triage,
  );
  const mappingPredicate = hasAllPermissionKeysPredicate(
    "p.profile_id",
    ASSIGNABILITY_PREDICATES.mapping,
  );

  const rows = (await queryable("profiles as p")
    .where("p.is_active", true)
    .whereRaw(
      `((p.is_assignable_triage = TRUE AND ${triagePredicate.sql}) OR (p.is_assignable_mapping = TRUE AND ${mappingPredicate.sql}))`,
      [...triagePredicate.bindings, ...mappingPredicate.bindings],
    )
    .select("p.profile_id")) as Array<{ profile_id: number }>;

  return rows.map((row) => Number(row.profile_id));
}

/** Verifica no banco se o Perfil cumpre o predicado de chaves da etapa. */
export async function profileHasAssignablePermissions(
  profileId: number,
  stage: AssignabilityStage,
  queryable: Knex = db,
): Promise<boolean> {
  const keys =
    stage === "triage" ? ASSIGNABILITY_PREDICATES.triage : ASSIGNABILITY_PREDICATES.mapping;
  const predicate = hasAllPermissionKeysPredicate("p.profile_id", keys);

  const row = await queryable("profiles as p")
    .where("p.profile_id", profileId)
    .whereRaw(predicate.sql, predicate.bindings)
    .first("p.profile_id");

  return row !== undefined;
}
