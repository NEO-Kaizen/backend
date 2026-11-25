import { AppError } from "../../shared/errors/AppError.ts";
import {
  ASSIGNABILITY_PREDICATES,
  buildEffectivePermissions,
  isCustody,
  isFixedOwn,
  PERMISSION_CATALOG,
  type Custody,
  type EffectivePermission,
  type PermissionKey,
} from "../../shared/catalog/permissionCatalog.ts";
import type { ProfilePermissionInput } from "../DTOs/profiles/Profiles.dto.ts";

/**
 * Guardas puras da composição de Perfil (contrato `docs/custom-roles.md` §§ 3–4).
 *
 * Módulo de domínio: sem HTTP, sem banco e sem relógio. O service orquestra as
 * leituras (estado atual, concessões do ator, solicitações abertas) e chama
 * estas funções para decidir; as recusas são `AppError` 400 com `code` estável.
 */

export type AssignabilityStage = "triage" | "mapping";

/** Ordem canônica das etapas de Atribuibilidade. */
export const ASSIGNABILITY_STAGES = [
  "triage",
  "mapping",
] as const satisfies readonly AssignabilityStage[];

/** Campo de flag de cada etapa em `profiles`/DTO. */
export const STAGE_FLAG_FIELD = {
  triage: "isAssignableTriage",
  mapping: "isAssignableMapping",
} as const satisfies Record<AssignabilityStage, string>;

/** Rótulo em português usado nas mensagens. */
export const STAGE_LABEL = {
  triage: "triagem",
  mapping: "mapeamento",
} as const satisfies Record<AssignabilityStage, string>;

/** Estado de composição considerado por uma operação (atual ou resultante do PATCH). */
export interface CompositionState {
  isAssignableTriage: boolean;
  isAssignableMapping: boolean;
  permissions: readonly EffectivePermission[];
}

/** Catálogo indexado por chave — evita varredura repetida nas guardas. */
const CATALOG_BY_KEY: ReadonlyMap<string, (typeof PERMISSION_CATALOG)[number]> = new Map(
  PERMISSION_CATALOG.map((entry) => [entry.key, entry] as const),
);

/** Concessão que o ator pode conceder, dado o próprio conjunto (§ 4.1). */
const CUSTODY_CONTAINMENT: Record<Custody, readonly Custody[]> = {
  global: ["global"],
  own: ["own"],
  assigned: ["assigned"],
  all: ["assigned", "all"],
};

function unknownKey(key: string): AppError {
  return new AppError(
    `Chave de permissão desconhecida: ${key}.`,
    400,
    "profile_permission_unknown_key",
  );
}

/**
 * Converte concessões `{ key, custody }` na lista efetiva: passa pelo catálogo
 * (ordem + coerência) via `buildEffectivePermissions`, que espera o formato da
 * linha persistida (`permission_key`).
 */
export function effectivePermissionsFromGrants(
  grants: readonly { key: string; custody: string }[],
): EffectivePermission[] {
  return buildEffectivePermissions(
    grants.map((grant) => ({ permission_key: grant.key, custody: grant.custody })),
  );
}

function invalidCustody(key: string, custody: string): AppError {
  return new AppError(
    `O vínculo '${custody}' não é permitido para a chave ${key}.`,
    400,
    "profile_permission_invalid_custody",
  );
}

/**
 * Valida a composição contra o catálogo e devolve as Permissões efetivas na
 * ordem do catálogo:
 *
 * - chave existente no catálogo; sem repetição;
 * - vínculo conhecido e aceito pela chave (`global` só `global`; posse fixa só
 *   `own`; demais custodiais `assigned`/`all`);
 * - dependências da § 1.7 presentes (`*:manage` → `*:read`,
 *   `status_override` → `status_change`, `respond`/`create` → `track`,
 *   `assign` → `assignee_directory:read`).
 */
export function validateComposition(
  input: readonly ProfilePermissionInput[],
): EffectivePermission[] {
  const seen = new Set<string>();

  for (const grant of input) {
    const entry = CATALOG_BY_KEY.get(grant.key);

    if (!entry) {
      throw unknownKey(grant.key);
    }

    if (!isCustody(grant.custody)) {
      throw invalidCustody(grant.key, grant.custody);
    }

    if (!(entry.allowedCustodies as readonly string[]).includes(grant.custody)) {
      if (isFixedOwn(entry)) {
        throw new AppError(
          `A chave ${grant.key} só aceita o vínculo 'own' (posse).`,
          400,
          "profile_permission_fixed_custody",
        );
      }
      throw invalidCustody(grant.key, grant.custody);
    }

    if (seen.has(grant.key)) {
      throw new AppError(
        `A chave ${grant.key} aparece mais de uma vez na composição.`,
        400,
        "profile_permission_duplicate_key",
      );
    }

    seen.add(grant.key);
  }

  for (const grant of input) {
    const entry = CATALOG_BY_KEY.get(grant.key);

    for (const dependency of entry?.dependencies ?? []) {
      if (!seen.has(dependency)) {
        throw new AppError(
          `A chave ${grant.key} exige também ${dependency}.`,
          400,
          "profile_permission_missing_dependency",
        );
      }
    }
  }

  // Fonte única da ordem efetiva e da coerência final (catálogo).
  return effectivePermissionsFromGrants(input);
}

/** Todas as chaves de trabalho (predicado) das etapas com a flag ligada presentes? */
export function validateAssignabilityPredicates(state: CompositionState): void {
  const keys = new Set(state.permissions.map((permission) => permission.key));

  for (const stage of ASSIGNABILITY_STAGES) {
    const flagOn = state[STAGE_FLAG_FIELD[stage]];

    if (!flagOn) {
      continue;
    }

    const missing = ASSIGNABILITY_PREDICATES[stage].filter((key) => !keys.has(key));

    if (missing.length > 0) {
      throw new AppError(
        `O perfil não pode ser atribuível em ${STAGE_LABEL[stage]} sem as chaves ${missing.join(", ")}.`,
        400,
        "profile_flag_predicate_missing",
      );
    }
  }
}

/**
 * Guarda 7 — custódia `assigned` sem atribuibilidade.
 * Um perfil que só enxerga o que está atribuído a ele precisa poder receber
 * atribuições; sem flag, a composição é incoerente.
 */
export function validateAssignedScope(state: CompositionState): void {
  const hasAssigned = state.permissions.some((permission) => permission.custody === "assigned");

  if (!hasAssigned || state.isAssignableTriage || state.isAssignableMapping) {
    return;
  }

  throw new AppError(
    "O escopo 'Atribuído' exige que o perfil seja atribuível à triagem ou ao mapeamento.",
    400,
    "profile_assigned_scope_without_assignability",
  );
}

/** Perda de chaves de trabalho de uma etapa entre o estado atual e o resultante. */
export interface WorkKeyLoss {
  stage: AssignabilityStage;
  missingKeys: readonly PermissionKey[];
  sourceFlag: boolean;
  targetFlag: boolean;
}

/**
 * Detecta a remoção de chaves de trabalho de uma etapa que era completa na
 * origem (guarda 6). Retorna vazio quando a composição de origem já não
 * satisfazia o predicado — nesse caso não há chave de trabalho a proteger.
 */
export function findWorkKeyLosses(
  source: CompositionState,
  target: CompositionState,
): WorkKeyLoss[] {
  const sourceKeys = new Set(source.permissions.map((permission) => permission.key));
  const targetKeys = new Set(target.permissions.map((permission) => permission.key));
  const losses: WorkKeyLoss[] = [];

  for (const stage of ASSIGNABILITY_STAGES) {
    const predicate = ASSIGNABILITY_PREDICATES[stage];
    const hadCompletePredicate = predicate.every((key) => sourceKeys.has(key));
    const missingKeys = predicate.filter((key) => !targetKeys.has(key));

    if (hadCompletePredicate && missingKeys.length > 0) {
      const flagField = STAGE_FLAG_FIELD[stage];
      losses.push({
        stage,
        missingKeys,
        sourceFlag: source[flagField],
        targetFlag: target[flagField],
      });
    }
  }

  return losses;
}

/**
 * Guarda 1 — sem escalação: toda chave concedida precisa existir no conjunto
 * do ator, e o vínculo nunca pode ser mais amplo que o do concedente
 * (`all` > `assigned`; `own` e `global` só iguais a si mesmos).
 */
export function assertNoEscalation(
  requested: readonly EffectivePermission[],
  actorPermissions: readonly EffectivePermission[],
): void {
  const actorCustodyByKey = new Map(
    actorPermissions.map((permission) => [permission.key, permission.custody]),
  );

  for (const grant of requested) {
    const actorCustody = actorCustodyByKey.get(grant.key);

    if (!actorCustody) {
      throw new AppError(
        `Você não pode conceder a chave ${grant.key}, que não possui.`,
        400,
        "profile_permission_key_escalation",
      );
    }

    if (!CUSTODY_CONTAINMENT[actorCustody].includes(grant.custody)) {
      throw new AppError(
        `Você não pode conceder ${grant.key} em '${grant.custody}': o seu vínculo é '${actorCustody}'.`,
        400,
        "profile_permission_custody_escalation",
      );
    }
  }
}

/** Estado mínimo de um Perfil para o instantâneo de auditoria. */
export interface ProfileSnapshotSource {
  name: string;
  description: string | null;
  isActive: boolean;
  isRoot: boolean;
  isAssignableTriage: boolean;
  isAssignableMapping: boolean;
  permissions: readonly EffectivePermission[];
}

/** Antes/depois canônico da Auditoria: JSON com a composição já validada e ordenada. */
export function profileSnapshot(profile: ProfileSnapshotSource): string {
  return JSON.stringify({
    name: profile.name,
    description: profile.description,
    isActive: profile.isActive,
    isRoot: profile.isRoot,
    isAssignableTriage: profile.isAssignableTriage,
    isAssignableMapping: profile.isAssignableMapping,
    permissions: profile.permissions,
  });
}
