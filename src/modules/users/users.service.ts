import { AppError } from "../../shared/errors/AppError.ts";
import { isUniqueViolation } from "../../shared/errors/databaseErrors.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import type { AssignabilityStage } from "../../shared/access/assignability.ts";
import { isAuthorityStrictlyBelow } from "../../shared/access/accountAuthority.ts";
import type { PermissionActor } from "../../shared/access/requestAccess.ts";
import {
  buildEffectivePermissions,
  type EffectivePermission,
} from "../../shared/catalog/permissionCatalog.ts";
import db from "../../database/conection.ts";
import path from "node:path";
import fs from "node:fs";
import Config from "../../configs.ts";
import { saveFiles } from "../../shared/storage/fileStorage.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import type { UserMetricsResponse, UserRow } from "../../shared/types/user.ts";
import { generateTemporaryPassword, hashPassword } from "../../shared/utils/passwordHandler.ts";
import type { Knex } from "knex";
import type {
  ChangeUserStatusRequest,
  CreateUserRequest,
  CreateProfessionalInput,
  ListUsersQuery,
  UpdateUserRequest,
} from "../DTOs/users/UserRequests.dto.ts";
import type {
  AssignableProfessional,
  ChangeUserStatusResponse,
  CreateUserResponse,
  ResetPasswordResponse,
  UserSummary,
} from "../DTOs/users/UserResponse.dto.ts";
import type {
  UserProfileResponseDTO,
  RequesterProfileBlock,
  ProfessionalProfileBlock,
} from "../DTOs/users/UserProfileResponse.dto.ts";
import type { UpdateProfilePayload } from "../DTOs/users/UpdateProfileRequest.dto.ts";
import * as repository from "./users.repository.ts";

const AVATAR_DIR = "avatars";

const CHANGE_ORIGIN_ADMIN = "admin";

/** Códigos estáveis das recusas da matriz de contas (contrato RBAC § 4.2). */
const CODE_ACCOUNT_OUT_OF_AUTHORITY = "account_out_of_authority";
const CODE_ROOT_ACCOUNT_PROTECTED = "root_account_protected";
const CODE_SELF_MANAGEMENT_FORBIDDEN = "self_management_forbidden";
const CODE_PROFILE_INACTIVE = "profile_inactive";
const CODE_USER_MANAGE_REQUIRED = "user_manage_required";
const CODE_PROFESSIONAL_PROFILE_NOT_ASSIGNABLE = "professional_profile_not_assignable";
const CODE_USER_HAS_OPEN_ASSIGNMENTS = "user_has_open_assignments";

function shouldHaveProfessionalExtension(
  profile: Pick<
    repository.ProfileLookupRow,
    "is_active" | "is_assignable_triage" | "is_assignable_mapping"
  >,
): boolean {
  return profile.is_active && (profile.is_assignable_triage || profile.is_assignable_mapping);
}

/** Verifica o conteúdo opcional e informa se a conta precisa da extensão. */
function resolveProfessionalExtensionRequirement(
  profile: Pick<
    repository.ProfileLookupRow,
    "is_active" | "is_assignable_triage" | "is_assignable_mapping"
  >,
  professional?: CreateProfessionalInput,
): boolean {
  const shouldHaveExtension = shouldHaveProfessionalExtension(profile);

  if (professional !== undefined && !shouldHaveExtension) {
    throw new AppError(
      "O conteúdo da Extensão de profissional só pode ser informado para Perfis atribuíveis.",
      400,
      CODE_PROFESSIONAL_PROFILE_NOT_ASSIGNABLE,
    );
  }

  return shouldHaveExtension;
}

/**
 * Ator da matriz de contas — as Permissões vêm do gate (`req.permissions`).
 * É o recorte de `PermissionActor` que a matriz precisa: o e-mail só importa à
 * Custódia de solicitações.
 */
export type AccountActor = Pick<PermissionActor, "id" | "permissions">;

interface ActorAuthority {
  readonly isRoot: boolean;
  readonly grants: readonly EffectivePermission[];
}

function parseUserId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Usuário não encontrado", 404);
  }
  return id;
}

/** Autoridade do ator: Permissões do gate + marca `is_root` do Perfil vigente. */
async function resolveActorAuthority(actor: AccountActor): Promise<ActorAuthority> {
  const actorUser = await repository.findUserById(actor.id);

  if (!actorUser) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  return { isRoot: actorUser.profile_is_root, grants: actor.permissions };
}

/**
 * Permissões efetivas do próprio ator para o autoatendimento, que não passa
 * pelo gate de chave. Lida do banco a cada chamada (§ 5).
 */
export async function loadActorPermissions(actorId: number): Promise<EffectivePermission[]> {
  const actorUser = await repository.findUserById(actorId);

  if (!actorUser) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const grants = await repository.listProfilePermissions(actorUser.profile_id);

  return buildEffectivePermissions(grants);
}

/** Concessões de um Perfil, validadas pelo catálogo (chave, vínculo e dependências). */
async function resolveProfileGrants(profileId: number): Promise<readonly EffectivePermission[]> {
  const grants = await repository.listProfilePermissions(profileId);

  return buildEffectivePermissions(grants);
}

/** Conta do Perfil Admin Root: única, criada só pelo seed e fora de rota (§ 4.2). */
function throwRootAccountProtected(): never {
  throw new AppError(
    "A conta Admin Root é criada apenas pelo seed e não pode ser gerenciada pelas rotas administrativas.",
    403,
    CODE_ROOT_ACCOUNT_PROTECTED,
  );
}

function throwProfileInactive(): never {
  throw new AppError(
    "Não é possível criar ou atualizar contas para um Perfil inativo.",
    409,
    CODE_PROFILE_INACTIVE,
  );
}

async function assertUserHasNoOpenAssignments(queryable: Knex, userId: number): Promise<void> {
  const assignedProtocols = await repository.listOpenAssignedProtocolsForUser(queryable, userId);
  if (assignedProtocols.length > 0) {
    throw new AppError(
      `Reatribua as solicitações abertas ${assignedProtocols.join(", ")} antes de alterar o Perfil ou desativar a conta.`,
      409,
      CODE_USER_HAS_OPEN_ASSIGNMENTS,
    );
  }
}

function throwOutOfAuthority(): never {
  throw new AppError(
    "O Perfil-alvo tem autoridade igual ou maior que a sua; só é possível gerenciar Perfis estritamente abaixo.",
    403,
    CODE_ACCOUNT_OUT_OF_AUTHORITY,
  );
}

/**
 * Conta existente sob a matriz (contrato RBAC § 4.2): conta do Perfil Admin Root
 * fica fora de rota; o Admin Root gerencia qualquer outra; os demais gerenciam
 * apenas Perfis **estritamente abaixo** do seu.
 */
async function assertAccountIsManageable(
  target: { readonly profile_id: number; readonly profile_is_root: boolean },
  actorAuthority: ActorAuthority,
): Promise<void> {
  if (target.profile_is_root) {
    throwRootAccountProtected();
  }

  if (actorAuthority.isRoot) {
    return;
  }

  const targetGrants = await resolveProfileGrants(target.profile_id);

  if (!isAuthorityStrictlyBelow(targetGrants, actorAuthority.grants)) {
    throwOutOfAuthority();
  }
}

/**
 * Perfil de destino (criação ou designação): não pode ser Admin Root nem estar
 * inativo, e precisa estar estritamente abaixo do ator.
 */
async function assertProfileIsManageable(
  profile: repository.ProfileLookupRow,
  actorAuthority: ActorAuthority,
): Promise<void> {
  if (profile.is_root) {
    throwRootAccountProtected();
  }

  if (!profile.is_active) {
    throwProfileInactive();
  }

  if (actorAuthority.isRoot) {
    return;
  }

  const profileGrants = await resolveProfileGrants(profile.profile_id);

  if (!isAuthorityStrictlyBelow(profileGrants, actorAuthority.grants)) {
    throwOutOfAuthority();
  }
}

/** Ninguém gerencia a própria conta pelas rotas administrativas (§ 4.2). */
function assertNotSelfManagement(targetId: number, actorId: number): void {
  if (targetId === actorId) {
    throw new AppError(
      "Você não pode gerenciar a própria conta pelas rotas administrativas.",
      403,
      CODE_SELF_MANAGEMENT_FORBIDDEN,
    );
  }
}

export async function listUsers(query: ListUsersQuery): Promise<PaginatedResponse<UserSummary>> {
  if (query.profile) {
    const profileId = await repository.findProfileIdByName(query.profile);
    if (profileId === null) {
      throw new AppError("Perfil inválido.", 400);
    }
  }

  return repository.listUsers(query);
}

export async function listAssignableProfessionals(
  stage: AssignabilityStage,
): Promise<AssignableProfessional[]> {
  return repository.listAssignableProfessionals(stage);
}

export const getUserMetrics = async (): Promise<UserMetricsResponse> => {
  return repository.fetchUserMetrics();
};

export async function createUser(
  payload: CreateUserRequest,
  actor: AccountActor,
  ipAddress: string | undefined,
): Promise<CreateUserResponse> {
  // Perfil é algo do banco (fonte de verdade), não um enum do código: perfis
  // futuros entram via `profiles` sem mudança de rota/schema — a validação
  // fica em aberto até cruzar a tabela (mesma regra do filtro da listagem).
  const profile = await repository.findProfileByName(payload.role);
  if (!profile) {
    throw new AppError("Perfil inválido.", 400);
  }

  // Matriz de contas ANTES de criar (§ 4.2): Admin Root fora de rota, Perfil
  // inativo recusado e autoridade estritamente abaixo do ator.
  const actorAuthority = await resolveActorAuthority(actor);
  await assertProfileIsManageable(profile, actorAuthority);

  const profileId = profile.profile_id;

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  let user: UserRow | undefined;
  try {
    // Inserção e evento de auditoria na MESMA transação: se o registro do
    // evento falhar, a criação é desfeita (rollback) — nunca fica um usuário
    // sem histórico.
    user = await db.transaction(async (trx) => {
      const currentProfile = await repository.findProfileById(profileId, {
        queryable: trx,
        shouldLockForShare: true,
      });
      if (!currentProfile) {
        throw new AppError("Perfil inválido.", 400);
      }
      if (!currentProfile.is_active) {
        throwProfileInactive();
      }
      if (currentProfile.is_root) {
        throwRootAccountProtected();
      }

      const needsProfessionalExtension = resolveProfessionalExtensionRequirement(
        currentProfile,
        payload.professional,
      );

      const created = await repository.createUser(
        trx,
        { fullName: payload.fullName, email: payload.email },
        passwordHash,
        profileId,
      );

      // A extensão é definida pelas flags do Perfil, nunca pelo nome. A linha
      // nasce na mesma transação da conta.
      if (needsProfessionalExtension) {
        await repository.createProfessionalData(trx, created.user_id, payload.professional);
      }

      await recordAudit(trx, {
        entityType: "user",
        entityId: String(created.user_id),
        actionType: "user.create",
        userId: actor.id,
        newValue: payload.email,
        ipAddress,
        changeOrigin: CHANGE_ORIGIN_ADMIN,
      });

      // Todo usuário é requester (contrato admin-provisioned): a extensão 1:1 nasce junto
      // com a conta usando o bloco obrigatório do payload (merge com adoção de linha anônima).
      await repository.createRequesterData(trx, created, payload.requester);

      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("E-mail já cadastrado", 409);
    }
    throw error;
  }

  if (!user) {
    throw new AppError("Falha ao criar o usuário", 500);
  }

  return {
    id: String(user.user_id),
    fullName: user.full_name,
    email: user.email,
    role: profile.name,
    isActive: user.is_active,
    mustChangePassword: user.must_change_password,
    createdAt: user.created_at.toISOString(),
    temporaryPassword,
  } satisfies CreateUserResponse;
}

export async function changeUserStatus(
  rawId: string,
  payload: ChangeUserStatusRequest,
  actor: AccountActor,
  ipAddress: string | undefined,
): Promise<ChangeUserStatusResponse> {
  const id = parseUserId(rawId);

  assertNotSelfManagement(id, actor.id);

  const user = await repository.findUserById(id);
  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  const actorAuthority = await resolveActorAuthority(actor);
  await assertAccountIsManageable(user, actorAuthority);

  // Update e evento de auditoria na MESMA transação: se o evento falhar,
  // a mudança de status é desfeita (rollback).
  await db.transaction(async (trx) => {
    if (!payload.isActive && user.is_active) {
      await assertUserHasNoOpenAssignments(trx, id);
    }

    await repository.updateStatus(trx, id, payload.isActive);

    await recordAudit(trx, {
      entityType: "user",
      entityId: String(id),
      actionType: payload.isActive ? "user.activate" : "user.deactivate",
      userId: actor.id,
      previousValue: String(user.is_active),
      newValue: String(payload.isActive),
      ipAddress,
      changeOrigin: CHANGE_ORIGIN_ADMIN,
    });
  });

  return { id: String(id), isActive: payload.isActive };
}

export async function resetPassword(
  rawId: string,
  actor: AccountActor,
  ipAddress: string | undefined,
): Promise<ResetPasswordResponse> {
  const id = parseUserId(rawId);

  assertNotSelfManagement(id, actor.id);

  const user = await repository.findUserById(id);
  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  const actorAuthority = await resolveActorAuthority(actor);
  await assertAccountIsManageable(user, actorAuthority);

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  // Update e evento de auditoria na MESMA transação: se o evento falhar,
  // a redefinição é desfeita (rollback).
  await db.transaction(async (trx) => {
    await repository.setTemporaryPassword(trx, id, passwordHash);

    await recordAudit(trx, {
      entityType: "user",
      entityId: String(id),
      actionType: "user.reset_password",
      userId: actor.id,
      ipAddress,
      changeOrigin: CHANGE_ORIGIN_ADMIN,
    });
  });

  return { id: String(id), temporaryPassword };
}

// ---------------------------------------------------------------------------
// Issue #125 — "Meus dados" (GET /users/me + PUT /users/me)
// ---------------------------------------------------------------------------

function toRequesterBlock(
  row: repository.UserProfileRow["requester"],
): RequesterProfileBlock | null {
  if (!row) return null;
  return {
    area: row.area,
    department: row.department,
    manager: row.manager_name,
    additionalContact: row.additional_contact,
  };
}

function toProfessionalBlock(
  row: repository.UserProfileRow["professional"],
): ProfessionalProfileBlock | null {
  if (!row) return null;
  return {
    jobTitle: row.job_title,
    specialties: row.specialties,
    attendedCategoryIds: row.attended_category_ids,
    notes: row.notes,
  };
}

function emptyProfessionalBlock(): ProfessionalProfileBlock {
  return { jobTitle: null, specialties: [], attendedCategoryIds: [], notes: null };
}

/**
 * `GET /users/me` — perfil completo do próprio usuário
 * (dados básicos + bloco requester + Extensão de profissional atribuível + avatar).
 */
export async function getMyProfile(userId: number): Promise<UserProfileResponseDTO> {
  const row = await repository.findUserProfile(userId);
  if (!row) {
    throw new AppError("Usuário não encontrado", 404);
  }

  const isAssignable = shouldHaveProfessionalExtension(row);
  // Usuário atribuível legado sem extensão recebe o bloco com
  // defaults em vez de null, sem exigir migração de dados.
  const professional: ProfessionalProfileBlock | null =
    isAssignable && !row.professional
      ? emptyProfessionalBlock()
      : toProfessionalBlock(row.professional);

  return {
    id: String(row.user_id),
    fullName: row.full_name,
    email: row.email,
    role: row.profile_name,
    avatarUrl: row.avatar_url,
    requester: toRequesterBlock(row.requester),
    professional,
  } satisfies UserProfileResponseDTO;
}

/** `GET /users/:id` — consulta administrativa do perfil completo. */
export async function getUser(rawId: string): Promise<UserProfileResponseDTO> {
  return getMyProfile(parseUserId(rawId));
}

/**
 * `PUT /users/me` — `fullName`, `additionalContact` e avatar são
 * autoeditáveis. Quem tem `user:manage` também pode editar os próprios dados
 * administrativos de requester. A Extensão de profissional continua pertencendo ao
 * fluxo administrativo em `PUT /users/:id`.
 */
export async function updateMyProfile(
  actor: AccountActor,
  payload: UpdateProfilePayload,
  avatarFile?: Express.Multer.File,
): Promise<UserProfileResponseDTO> {
  // Self-service: o dono da conta é o próprio ator.
  const userId = actor.id;

  // Operação de avatar ambígua: remover E enviar arquivo novo na mesma
  // requisição. Sem este guard o arquivo seria descartado em silêncio (o
  // cliente acharia ter trocado a foto). Fail-fast: escolha uma operação.
  if (payload.removeAvatar === true && avatarFile) {
    throw new AppError("Envie 'removeAvatar' ou 'avatar', não ambos.", 400);
  }

  const user = await repository.findUserById(userId);
  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  // Snapshot anterior para auditoria (nome, requester e avatar).
  const snapshot = await repository.findUserProfile(userId);
  const previousValue = {
    fullName: snapshot?.full_name ?? user.full_name,
    requester: snapshot?.requester ?? null,
    avatarUrl: snapshot?.avatar_url ?? null,
    removeAvatar: payload.removeAvatar ?? false,
  };

  await db.transaction(async (trx) => {
    // ----- identidade self-service (somente nome) -----
    if (payload.fullName !== undefined) {
      await repository.updateUserFields(trx, userId, { fullName: payload.fullName });
      await repository.syncRequesterIdentity(trx, userId, {
        fullName: payload.fullName,
        corporateEmail: user.email,
      });
    }

    // ----- bloco requester -----
    if (payload.requester) {
      const rawRequester = payload.requester as unknown as Record<string, unknown>;
      const changesAdministrativeFields =
        "area" in rawRequester || "department" in rawRequester || "manager" in rawRequester;

      // A autorização decide por chave: só quem tem `user:manage` altera os
      // dados administrativos do próprio bloco requester (§ 4.2).
      const canManageAccounts = actor.permissions.some(
        (permission) => permission.key === "user:manage",
      );

      if (changesAdministrativeFields && !canManageAccounts) {
        throw new AppError(
          "Área, departamento e gestor só podem ser alterados por quem tem a permissão user:manage. Use PUT /users/:id.",
          403,
          CODE_USER_MANAGE_REQUIRED,
        );
      }

      // Merge parcial: campos ausentes são preservados. Também cobre usuários
      // legados que ainda não possuem a extensão requester.
      await repository.mergeRequesterData(
        trx,
        userId,
        payload.fullName ?? user.full_name,
        user.email,
        {
          area: payload.requester.area,
          department: payload.requester.department,
          manager: payload.requester.manager,
          additionalContact: payload.requester.additionalContact,
        },
      );
    }

    // ----- avatar -----
    if (payload.removeAvatar && snapshot?.avatar_url) {
      await removeAvatarFile(snapshot.avatar_url);
      await repository.removeUserAvatar(trx, userId);
    } else if (avatarFile && snapshot?.avatar_url) {
      await removeAvatarFile(snapshot.avatar_url);
      const url = await saveAndPersistAvatar(trx, userId, avatarFile);
      await repository.setUserAvatar(trx, userId, url);
    } else if (avatarFile) {
      const url = await saveAndPersistAvatar(trx, userId, avatarFile);
      await repository.setUserAvatar(trx, userId, url);
    }

    await recordAudit(trx, {
      entityType: "user",
      entityId: String(userId),
      actionType: "user.update_profile",
      userId: actor.id,
      previousValue: JSON.stringify(previousValue),
      newValue: JSON.stringify({
        fullName: payload.fullName ?? null,
        requester: payload.requester ?? null,
        avatarChanged: avatarFile !== undefined || payload.removeAvatar === true,
      }),
      note: "self-edit via PUT /users/me",
      changeOrigin: "self",
    });
  });

  return getMyProfile(userId);
}

async function saveAndPersistAvatar(
  trx: Knex.Transaction,
  userId: number,
  file: Express.Multer.File,
): Promise<string> {
  const saved = await saveFiles([file], path.resolve(Config.UPLOAD_DIR, AVATAR_DIR), ["avatar"]);
  const attachment = saved[0];
  if (!attachment) {
    throw new AppError("Falha ao salvar o avatar", 500);
  }
  return `/uploads/${AVATAR_DIR}/${attachment.storageKey}`;
}

function removeAvatarFile(currentUrl: string): void {
  const key = currentUrl.split("/").pop() ?? "";
  const storagePath = path.resolve(Config.UPLOAD_DIR, AVATAR_DIR, key);
  void fs.promises.rm(storagePath, { force: true }).catch(() => {
    // arquivo já removido ou inexistente; não bloqueia a operação
  });
}

/**
 * `PUT /users/:id` — edição completa por `user:manage` (merge). Atualiza
 * `fullName`, `email`, `role`, `professional` e `requester` de forma parcial
 * (ausente mantém). Auditoria `user.update`, transação atômica. A matriz de
 * contas (§ 4.2) governa a conta-alvo e o Perfil de destino da designação.
 */
export async function updateUser(
  rawId: string,
  payload: UpdateUserRequest,
  actor: AccountActor,
  ipAddress: string | undefined,
): Promise<UserProfileResponseDTO> {
  const id = parseUserId(rawId);

  assertNotSelfManagement(id, actor.id);

  const target = await repository.findUserById(id);
  if (!target) {
    throw new AppError("Usuário não encontrado", 404);
  }

  const actorAuthority = await resolveActorAuthority(actor);
  await assertAccountIsManageable(target, actorAuthority);

  // A designação só é validada quando o Perfil realmente muda: reenviar o
  // Perfil atual não é designação nova (e não deve esbarrar em Perfil inativo).
  let newProfileId: number | undefined;
  if (payload.role !== undefined) {
    const profile = await repository.findProfileByName(payload.role);
    if (!profile) {
      throw new AppError("Perfil inválido.", 400);
    }
    if (profile.profile_id !== target.profile_id) {
      await assertProfileIsManageable(profile, actorAuthority);
      newProfileId = profile.profile_id;
    }
  }

  // Snapshot para auditoria
  const before = await repository.findUserProfile(id);

  try {
    await db.transaction(async (trx) => {
      const sourceProfile = await repository.findProfileById(target.profile_id, {
        queryable: trx,
        shouldLockForShare: true,
      });
      if (!sourceProfile) {
        throw new AppError("Perfil inválido.", 400);
      }
      const destinationProfileId = newProfileId ?? target.profile_id;
      const destinationProfile =
        destinationProfileId === sourceProfile.profile_id
          ? sourceProfile
          : await repository.findProfileById(destinationProfileId, {
              queryable: trx,
              shouldLockForShare: true,
            });
      if (!destinationProfile) {
        throw new AppError("Perfil inválido.", 400);
      }
      if (!destinationProfile.is_active) {
        throwProfileInactive();
      }
      const needsProfessionalExtension = resolveProfessionalExtensionRequirement(
        destinationProfile,
        payload.professional,
      );

      // 1. Campos básicos users (merge)
      await repository.updateUserFields(trx, id, {
        fullName: payload.fullName,
        email: payload.email,
        profileId: newProfileId,
      });

      // 2. Sincroniza identidade do requester se fullName/email mudaram
      if (payload.fullName !== undefined || payload.email !== undefined) {
        const fullName = payload.fullName ?? target.full_name;
        const corporateEmail = (payload.email ?? target.email).trim().toLowerCase();
        await repository.syncRequesterIdentity(trx, id, { fullName, corporateEmail });
      }

      // 3. A extensão acompanha as flags do Perfil; dados enviados são merge.
      if (payload.professional !== undefined) {
        await repository.upsertProfessionalData(trx, id, payload.professional);
      } else if (newProfileId !== undefined && !needsProfessionalExtension) {
        await assertUserHasNoOpenAssignments(trx, id);
        await repository.deleteProfessionalData(trx, id);
      } else if (needsProfessionalExtension) {
        await repository.createProfessionalData(trx, id);
      }

      // 4. Requester (1:1) — merge parcial
      if (payload.requester !== undefined) {
        const fullName = payload.fullName ?? target.full_name;
        const corporateEmail = (payload.email ?? target.email).trim().toLowerCase();
        await repository.mergeRequesterData(trx, id, fullName, corporateEmail, {
          area: payload.requester.area,
          department: payload.requester.department,
          manager: payload.requester.manager,
          additionalContact: payload.requester.additionalContact,
        });
      }

      await recordAudit(trx, {
        entityType: "user",
        entityId: String(id),
        actionType: "user.update",
        userId: actor.id,
        previousValue: JSON.stringify(before ?? null),
        newValue: JSON.stringify(payload),
        ipAddress,
        changeOrigin: CHANGE_ORIGIN_ADMIN,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("E-mail já cadastrado", 409);
    }
    throw error;
  }

  const updated = await repository.findUserProfile(id);
  if (!updated) {
    throw new AppError("Usuário não encontrado", 404);
  }
  const isUpdatedProfileAssignable = shouldHaveProfessionalExtension(updated);
  const professional =
    isUpdatedProfileAssignable && !updated.professional
      ? emptyProfessionalBlock()
      : toProfessionalBlock(updated.professional);

  return {
    id: String(updated.user_id),
    fullName: updated.full_name,
    email: updated.email,
    role: updated.profile_name,
    avatarUrl: updated.avatar_url,
    requester: toRequesterBlock(updated.requester),
    professional,
  } satisfies UserProfileResponseDTO;
}
