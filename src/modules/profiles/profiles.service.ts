import type { Knex } from "knex";
import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import {
  ASSIGNABILITY_PREDICATES,
  buildEffectivePermissions,
  PERMISSION_CATALOG,
  type EffectivePermission,
} from "../../shared/catalog/permissionCatalog.ts";
import type { ProfileWithUserCountRow } from "../../shared/types/profile.ts";
import type {
  ChangeProfileStatusRequest,
  ChangeProfileStatusResponse,
  CreateProfileRequest,
  DuplicateProfileRequest,
  PermissionCatalogResponse,
  ProfileDTO,
  UpdateProfileRequest,
} from "../DTOs/profiles/Profiles.dto.ts";
import * as repository from "./profiles.repository.ts";
import {
  assertNoEscalation,
  effectivePermissionsFromGrants,
  findWorkKeyLosses,
  profileSnapshot,
  STAGE_LABEL,
  validateAssignabilityPredicates,
  validateComposition,
  type CompositionState,
} from "./profiles.composition.ts";

const CHANGE_ORIGIN_ADMIN = "admin";

/** Ator da operação: id da sessão + conjunto efetivo de Permissões (nunca do body). */
export interface ProfileActor {
  userId: number;
  permissions: readonly EffectivePermission[];
}

function parseProfileId(rawId: string): number {
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Perfil não encontrado", 404);
  }

  return id;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "23505"
  );
}

function profileState(
  row: ProfileWithUserCountRow,
  permissions: readonly { key: string; custody: string }[],
): CompositionState {
  return {
    isAssignableTriage: row.is_assignable_triage,
    isAssignableMapping: row.is_assignable_mapping,
    permissions,
  };
}

function toDTO(
  row: ProfileWithUserCountRow,
  permissions: readonly { key: string; custody: string }[],
): ProfileDTO {
  return {
    id: String(row.profile_id),
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    isRoot: row.is_root,
    isAssignableTriage: row.is_assignable_triage,
    isAssignableMapping: row.is_assignable_mapping,
    userCount: row.user_count,
    permissions: effectivePermissionsFromGrants(permissions),
  };
}

async function permissionsOf(profileId: number): Promise<EffectivePermission[]> {
  return buildEffectivePermissions(await repository.listPermissionsByProfileIds([profileId]));
}

async function assertNameAvailable(name: string, excludeProfileId?: number): Promise<void> {
  const existing = await repository.findActiveProfileByName(name, excludeProfileId);

  if (existing) {
    throw new AppError(
      `Já existe um perfil ativo com o nome "${existing.name}".`,
      400,
      "profile_name_taken",
    );
  }
}

/**
 * Guarda 6 — edição atômica da chave de trabalho.
 *
 * Perder chave de trabalho com a flag ainda ligada é recusado com instrução
 * (desligue a flag na mesma chamada). Desligar a flag junto só é aceito quando
 * não há solicitações abertas atribuídas a usuários do Perfil na etapa; se
 * houver, a recusa lista os protocolos até a realocação por `request:assign`.
 */
async function assertWorkKeyGuard(
  source: CompositionState,
  target: CompositionState,
  profileId: number,
): Promise<void> {
  for (const loss of findWorkKeyLosses(source, target)) {
    if (loss.targetFlag) {
      throw new AppError(
        `Remover as chaves ${loss.missingKeys.join(", ")} manteria o perfil atribuível em ` +
          `${STAGE_LABEL[loss.stage]}. Desligue a flag correspondente na mesma chamada.`,
        400,
        "profile_work_key_flag_on",
      );
    }

    if (!loss.sourceFlag) {
      continue;
    }

    const protocols = await repository.listOpenAssignedProtocols(profileId, loss.stage);

    if (protocols.length > 0) {
      throw new AppError(
        `Há solicitações abertas atribuídas a usuários deste perfil em ${STAGE_LABEL[loss.stage]}: ` +
          `${protocols.join(", ")}. Realoque-as antes de desligar a flag e remover as chaves de trabalho.`,
        400,
        "profile_work_key_open_requests",
      );
    }
  }
}

/** Lista os Perfis (ativos e inativos) com composição ordenada e contagem de contas. */
export async function listProfiles(): Promise<ProfileDTO[]> {
  const rows = await repository.listProfiles();
  const grants = await repository.listPermissionsByProfileIds(rows.map((row) => row.profile_id));
  const grantsByProfile = new Map<number, { key: string; custody: string }[]>();

  for (const grant of grants) {
    const list = grantsByProfile.get(grant.profile_id) ?? [];
    list.push({ key: grant.permission_key, custody: grant.custody });
    grantsByProfile.set(grant.profile_id, list);
  }

  return rows.map((row) => toDTO(row, grantsByProfile.get(row.profile_id) ?? []));
}

/** Detalhe de um Perfil. */
export async function getProfile(rawId: string): Promise<ProfileDTO> {
  const id = parseProfileId(rawId);
  const row = await repository.findProfileById(id);

  if (!row) {
    throw new AppError("Perfil não encontrado", 404);
  }

  return toDTO(row, await permissionsOf(id));
}

/** Catálogo de chaves do editor (tipo, vínculos permitidos, dependências, predicados). */
export function getKeyCatalog(): PermissionCatalogResponse {
  return {
    permissions: PERMISSION_CATALOG.map((entry) => ({
      key: entry.key,
      custodyType: entry.custodyType,
      allowedCustodies: entry.allowedCustodies,
      dependencies: entry.dependencies,
    })),
    assignabilityPredicates: {
      triage: ASSIGNABILITY_PREDICATES.triage,
      mapping: ASSIGNABILITY_PREDICATES.mapping,
    },
  };
}

/** Cria um Perfil customizado — mesmo fluxo de validação da duplicação. */
export async function createProfile(
  payload: CreateProfileRequest,
  actor: ProfileActor,
  ipAddress: string | undefined,
): Promise<ProfileDTO> {
  const permissions = validateComposition(payload.permissions);
  const flags = {
    isAssignableTriage: payload.isAssignableTriage ?? false,
    isAssignableMapping: payload.isAssignableMapping ?? false,
  };

  validateAssignabilityPredicates({ ...flags, permissions });
  assertNoEscalation(permissions, actor.permissions);
  await assertNameAvailable(payload.name);

  let created: ProfileWithUserCountRow;

  try {
    created = await db.transaction(async (trx) => {
      const row = await repository.insertProfile(trx, {
        name: payload.name,
        description: payload.description ?? null,
        ...flags,
      });

      await repository.replacePermissions(trx, row.profile_id, permissions);
      await writeAudit(trx, {
        actorUserId: actor.userId,
        profileId: row.profile_id,
        actionType: "profile.create",
        previous: null,
        next: { ...row, user_count: 0 },
        permissions,
        ipAddress,
      });

      return { ...row, user_count: 0 };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("Já existe um perfil ativo com esse nome.", 400, "profile_name_taken");
    }
    throw error;
  }

  return toDTO(created, permissions);
}

/** Edição parcial e atômica — campo ausente é intocado; `permissions` presente substitui tudo. */
export async function updateProfile(
  rawId: string,
  payload: UpdateProfileRequest,
  actor: ProfileActor,
  ipAddress: string | undefined,
): Promise<ProfileDTO> {
  const id = parseProfileId(rawId);
  const current = await repository.findProfileById(id);

  if (!current) {
    throw new AppError("Perfil não encontrado", 404);
  }

  const currentPermissions = await permissionsOf(id);
  const isRootProfile = current.is_root;

  // Guarda 2 — só o Admin Root edita o Perfil Admin Root.
  if (isRootProfile && !(await repository.actorIsRoot(actor.userId))) {
    throw new AppError(
      "Apenas o Admin Root edita o perfil Admin Root.",
      403,
      "profile_root_protected",
    );
  }

  const nextPermissions =
    payload.permissions !== undefined
      ? validateComposition(payload.permissions)
      : currentPermissions;
  const nextFlags = {
    isAssignableTriage: payload.isAssignableTriage ?? current.is_assignable_triage,
    isAssignableMapping: payload.isAssignableMapping ?? current.is_assignable_mapping,
  };

  // Guarda 2 — o Perfil Admin Root nunca perde `profile:manage` nem é atribuível.
  if (isRootProfile) {
    if (!nextPermissions.some((permission) => permission.key === "profile:manage")) {
      throw new AppError(
        "O perfil Admin Root não pode perder profile:manage.",
        400,
        "profile_root_requires_manage",
      );
    }

    if (nextFlags.isAssignableTriage || nextFlags.isAssignableMapping) {
      throw new AppError(
        "O perfil Admin Root não é atribuível.",
        400,
        "profile_root_not_assignable",
      );
    }
  }

  if (payload.permissions !== undefined) {
    assertNoEscalation(nextPermissions, actor.permissions);
  }

  await assertWorkKeyGuard(
    profileState(current, currentPermissions),
    {
      ...nextFlags,
      permissions: nextPermissions,
    },
    id,
  );

  validateAssignabilityPredicates({ ...nextFlags, permissions: nextPermissions });

  if (payload.name !== undefined) {
    await assertNameAvailable(payload.name, id);
  }

  const nextState = {
    name: payload.name ?? current.name,
    description: payload.description !== undefined ? payload.description : current.description,
    isActive: current.is_active,
    isRoot: current.is_root,
    ...nextFlags,
    permissions: nextPermissions,
  };

  try {
    await db.transaction(async (trx) => {
      await repository.updateProfileFields(trx, id, {
        name: payload.name,
        description: payload.description,
        isAssignableTriage: payload.isAssignableTriage,
        isAssignableMapping: payload.isAssignableMapping,
      });

      if (payload.permissions !== undefined) {
        await repository.replacePermissions(trx, id, nextPermissions);
      }

      await recordAudit(trx, {
        entityType: "profile",
        entityId: String(id),
        actionType: "profile.update",
        userId: actor.userId,
        previousValue: profileSnapshot(profileSnapshotSource(current, currentPermissions)),
        newValue: profileSnapshot(nextState),
        ipAddress,
        changeOrigin: CHANGE_ORIGIN_ADMIN,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("Já existe um perfil ativo com esse nome.", 400, "profile_name_taken");
    }
    throw error;
  }

  return getProfile(rawId);
}

/** Ativa ou desativa — desativação bloqueada com contas vinculadas (regra uniforme). */
export async function changeProfileStatus(
  rawId: string,
  payload: ChangeProfileStatusRequest,
  actor: ProfileActor,
  ipAddress: string | undefined,
): Promise<ChangeProfileStatusResponse> {
  const id = parseProfileId(rawId);
  const current = await repository.findProfileById(id);

  if (!current) {
    throw new AppError("Perfil não encontrado", 404);
  }

  if (current.is_root && !payload.isActive) {
    throw new AppError(
      "O perfil Admin Root não pode ser desativado.",
      400,
      "profile_root_not_deactivatable",
    );
  }

  if (current.is_active && !payload.isActive && current.user_count > 0) {
    throw new AppError(
      `O perfil tem ${current.user_count} conta(s) vinculada(s). ` +
        "Realoque as contas para outro perfil antes de desativá-lo.",
      400,
      "profile_has_users",
    );
  }

  if (!current.is_active && payload.isActive) {
    await assertNameAvailable(current.name, id);
  }

  const currentPermissions = await permissionsOf(id);

  try {
    await db.transaction(async (trx) => {
      await repository.updateProfileFields(trx, id, { isActive: payload.isActive });

      await writeAudit(trx, {
        actorUserId: actor.userId,
        profileId: id,
        actionType: payload.isActive ? "profile.activate" : "profile.deactivate",
        previous: current,
        next: { ...current, is_active: payload.isActive },
        permissions: currentPermissions,
        ipAddress,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        "Já existe um perfil ativo com esse nome. Renomeie-o antes de reativar.",
        400,
        "profile_name_taken",
      );
    }
    throw error;
  }

  return { id: String(id), isActive: payload.isActive };
}

/**
 * Cria um customizado a partir da composição e das flags de outro Perfil —
 * base ou customizado. A cópia nasce como custom (nunca root) e passa pelas
 * mesmas validações da criação, sempre contra o conjunto do ator: duplicar é
 * atalho de edição, não forma de escalação (contrato § 2.3).
 */
export async function duplicateProfile(
  rawId: string,
  payload: DuplicateProfileRequest,
  actor: ProfileActor,
  ipAddress: string | undefined,
): Promise<ProfileDTO> {
  const id = parseProfileId(rawId);
  const source = await repository.findProfileById(id);

  if (!source) {
    throw new AppError("Perfil não encontrado", 404);
  }

  const sourcePermissions = await permissionsOf(id);
  const flags = {
    isAssignableTriage: source.is_assignable_triage,
    isAssignableMapping: source.is_assignable_mapping,
  };

  validateAssignabilityPredicates({ ...flags, permissions: sourcePermissions });
  assertNoEscalation(sourcePermissions, actor.permissions);
  await assertNameAvailable(payload.name);

  const description = payload.description !== undefined ? payload.description : source.description;

  let created: ProfileWithUserCountRow;

  try {
    created = await db.transaction(async (trx) => {
      const row = await repository.insertProfile(trx, {
        name: payload.name,
        description: description ?? null,
        ...flags,
      });

      await repository.replacePermissions(trx, row.profile_id, sourcePermissions);
      await recordAudit(trx, {
        entityType: "profile",
        entityId: String(row.profile_id),
        actionType: "profile.duplicate",
        userId: actor.userId,
        previousValue: null,
        newValue: profileSnapshot(
          profileSnapshotSource({ ...row, user_count: 0 }, sourcePermissions),
        ),
        note: `Duplicado do perfil ${source.name} (#${source.profile_id})`,
        ipAddress,
        changeOrigin: CHANGE_ORIGIN_ADMIN,
      });

      return { ...row, user_count: 0 };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("Já existe um perfil ativo com esse nome.", 400, "profile_name_taken");
    }
    throw error;
  }

  return toDTO(created, sourcePermissions);
}

function profileSnapshotSource(
  row: ProfileWithUserCountRow,
  permissions: readonly { key: string; custody: string }[],
) {
  return {
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    isRoot: row.is_root,
    isAssignableTriage: row.is_assignable_triage,
    isAssignableMapping: row.is_assignable_mapping,
    permissions,
  };
}

async function writeAudit(
  trx: Knex.Transaction,
  entry: {
    actorUserId: number;
    profileId: number;
    actionType: "profile.create" | "profile.activate" | "profile.deactivate";
    previous: ProfileWithUserCountRow | null;
    next: ProfileWithUserCountRow;
    permissions: readonly { key: string; custody: string }[];
    ipAddress: string | undefined;
  },
): Promise<void> {
  await recordAudit(trx, {
    entityType: "profile",
    entityId: String(entry.profileId),
    actionType: entry.actionType,
    userId: entry.actorUserId,
    previousValue: entry.previous
      ? profileSnapshot(profileSnapshotSource(entry.previous, entry.permissions))
      : null,
    newValue: profileSnapshot(profileSnapshotSource(entry.next, entry.permissions)),
    ipAddress: entry.ipAddress,
    changeOrigin: CHANGE_ORIGIN_ADMIN,
  });
}
