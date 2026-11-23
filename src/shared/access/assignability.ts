import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { ASSIGNABILITY_PREDICATES, type PermissionKey } from "../catalog/permissionCatalog.ts";
import { AppError } from "../errors/AppError.ts";

/**
 * Atribuibilidade (§ 1.4 do contrato RBAC): a flag do Perfil **e** o predicado
 * de chaves de trabalho. A flag sozinha não basta, e ter as chaves também não.
 */
export type AssignabilityStage = "triage" | "mapping";

export const CODE_ASSIGNEE_NOT_ASSIGNABLE = "assignee_not_assignable";

export interface AssigneeEligibilityRow {
  readonly professional_status: string;
  readonly user_is_active: boolean;
  readonly profile_is_active: boolean;
}

export function assertAssigneeTargetEligible<T extends AssigneeEligibilityRow>(
  candidate: T | null | undefined,
): asserts candidate is T {
  if (
    !candidate ||
    candidate.professional_status !== "active" ||
    !candidate.user_is_active ||
    !candidate.profile_is_active
  ) {
    throw assigneeNotAssignable();
  }
}

export function assigneeNotAssignable(): AppError {
  return new AppError(
    "O alvo não pode ser escolhido como Responsável.",
    400,
    CODE_ASSIGNEE_NOT_ASSIGNABLE,
  );
}

export const ASSIGNABILITY_FLAGS = {
  triage: "is_assignable_triage",
  mapping: "is_assignable_mapping",
} as const satisfies Record<AssignabilityStage, string>;

export interface FindAssignableProfilesOptions {
  readonly queryable?: Knex;
  /** Omit to return profiles assignable to either stage. */
  readonly stage?: AssignabilityStage;
}

export interface IsProfileAssignableOptions {
  readonly queryable?: Knex;
}

export interface ProfileAssignablePermissionsOptions {
  readonly queryable?: Knex;
  readonly requireFlag?: boolean;
  readonly requireActive?: boolean;
}

export interface PermissionKeysPredicate {
  readonly sql: string;
  readonly bindings: Array<string | number>;
}

/** Predicado SQL: o Perfil possui todas as chaves informadas. */
export function hasAllPermissionKeysPredicate(
  profileIdExpression: string,
  keys: readonly PermissionKey[],
): PermissionKeysPredicate {
  const placeholders = keys.map(() => "?").join(", ");

  return {
    sql: `(SELECT COUNT(DISTINCT pp.permission_key) FROM profile_permissions AS pp WHERE pp.profile_id = ${profileIdExpression} AND pp.permission_key IN (${placeholders})) = ?`,
    bindings: [...keys, keys.length],
  };
}

function buildAssignableProfilePredicate(
  stages: readonly AssignabilityStage[],
): PermissionKeysPredicate {
  const predicates = stages.map((stage) => ({
    stage,
    predicate: hasAllPermissionKeysPredicate("p.profile_id", ASSIGNABILITY_PREDICATES[stage]),
  }));

  return {
    sql: predicates
      .map(({ stage, predicate }) => {
        return `(p.${ASSIGNABILITY_FLAGS[stage]} = TRUE AND ${predicate.sql})`;
      })
      .join(" OR "),
    bindings: predicates.flatMap(({ predicate }) => predicate.bindings),
  };
}

/** Perfis ativos atribuíveis à etapa informada (ou a ambas) por flag + predicado. */
export async function findAssignableProfileIds(
  options: FindAssignableProfilesOptions = {},
): Promise<number[]> {
  const { queryable = db, stage } = options;
  const stages: readonly AssignabilityStage[] = stage ? [stage] : ["triage", "mapping"];
  const predicate = buildAssignableProfilePredicate(stages);

  const rows = (await queryable("profiles as p")
    .where("p.is_active", true)
    .whereRaw(`(${predicate.sql})`, predicate.bindings)
    .select("p.profile_id")) as Array<{ profile_id: number }>;

  return rows.map((row) => Number(row.profile_id));
}

/** True quando o Perfil ativo atende à flag e às chaves de ao menos uma etapa. */
export async function isProfileAssignable(
  profileId: number,
  options: IsProfileAssignableOptions = {},
): Promise<boolean> {
  const { queryable = db } = options;
  const predicate = buildAssignableProfilePredicate(["triage", "mapping"]);
  const row = await queryable("profiles as p")
    .where("p.profile_id", profileId)
    .where("p.is_active", true)
    .whereRaw(`(${predicate.sql})`, predicate.bindings)
    .first("p.profile_id");

  return row !== undefined;
}

/**
 * Verifica as chaves de trabalho da etapa. Por padrão não exige a flag de
 * Atribuibilidade nem que o Perfil esteja ativo; passe `requireFlag` e
 * `requireActive` para validar o Perfil como designável naquela etapa.
 */
export async function profileHasAssignablePermissions(
  profileId: number,
  stage: AssignabilityStage,
  options: ProfileAssignablePermissionsOptions = {},
): Promise<boolean> {
  const { queryable = db, requireFlag = false, requireActive = false } = options;
  const keys =
    stage === "triage" ? ASSIGNABILITY_PREDICATES.triage : ASSIGNABILITY_PREDICATES.mapping;
  const predicate = hasAllPermissionKeysPredicate("p.profile_id", keys);

  const query = queryable("profiles as p")
    .where("p.profile_id", profileId)
    .whereRaw(predicate.sql, predicate.bindings);

  if (requireFlag) {
    query.andWhere(`p.${ASSIGNABILITY_FLAGS[stage]}`, true);
  }
  if (requireActive) {
    query.andWhere("p.is_active", true);
  }

  const row = await query.first("p.profile_id");

  return row !== undefined;
}
