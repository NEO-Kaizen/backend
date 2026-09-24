import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import path from "node:path";
import fs from "node:fs";
import Config from "../../configs.ts";
import { saveFiles } from "../../shared/storage/fileStorage.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import type { UserMetricsResponse, UserRow } from "../../shared/types/user.ts";
import { resolveRole } from "../../shared/utils/roleUtils.ts";
import type { Role } from "../../shared/types/role.ts";
import { generateTemporaryPassword, hashPassword } from "../../shared/utils/passwordHandler.ts";
import type { Knex } from "knex";
import type {
  ChangeUserStatusRequest,
  CreateUserRequest,
  ListUsersQuery,
  UpdateUserRequest,
} from "../DTOs/users/UserRequests.dto.ts";
import type {
  AssignAnalyst,
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
const ROLE_ANALYST = "analista";

const CHANGE_ORIGIN_ADMIN = "admin";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "23505"
  );
}

function parseUserId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Usuário não encontrado", 404);
  }
  return id;
}

/**
 * Valida que o perfil-alvo pode ser gerenciado pelo perfil atual.
 *
 * Hoje apenas Administrador gerencia contas (rotas protegidas por
 * requireRole) e ninguém gerencia contas de **Administrador** — evita
 * escalonamento vertical (um admin assumir o controle de outro admin).
 * Evolui para uma hierarquia ordenada quando houver novos perfis gestores.
 */
function assertRoleIsManageable(role: Role): void {
  if (role === "Administrador") {
    throw new AppError("Não é possível gerenciar contas de Administradores", 403);
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

export async function listAnalysts(): Promise<AssignAnalyst[]> {
  return repository.listAnalysts();
}

export const getUserMetrics = async (): Promise<UserMetricsResponse> => {
  return repository.fetchUserMetrics();
};

export async function createUser(
  payload: CreateUserRequest,
  actorUserId: number,
  ipAddress: string | undefined,
): Promise<CreateUserResponse> {
  // Perfil é algo do banco (fonte de verdade), não um enum do código: perfis
  // futuros entram via `profiles` sem mudança de rota/schema — a validação
  // fica em aberto até cruzar a tabela (mesma regra do filtro da listagem).
  const profileId = await repository.findProfileIdByName(payload.role);
  if (profileId === null) {
    throw new AppError("Perfil inválido.", 400);
  }

  // Hierarquia ANTES de criar: nenhum perfil cria contas de Administrador.
  assertRoleIsManageable(resolveRole(payload.role));

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  let user: UserRow | undefined;
  try {
    // Inserção e evento de auditoria na MESMA transação: se o registro do
    // evento falhar, a criação é desfeita (rollback) — nunca fica um usuário
    // sem histórico.
    user = await db.transaction(async (trx) => {
      const created = await repository.createUser(
        trx,
        { fullName: payload.fullName, email: payload.email },
        passwordHash,
        profileId,
      );

      // Issue A (#106): analista nasce com a extensão details_professional (1:1 com
      // users, card de perfil) usando os dados profissionais enviados no payload —
      // obrigatórios para o perfil (o schema já valida; guard defensivo para o
      // service não depender do contrato de entrada). Atômico com a criação:
      // se a extensão falhar, o usuário não é criado (rollback junto com a auditoria).
      if (repository.isProfessionalProfile(payload.role)) {
        const professional = payload.professional;
        if (!professional) {
          throw new AppError("Dados profissionais são obrigatórios para o perfil Analista", 400);
        }
        await repository.createProfessionalData(trx, created.user_id, professional);
      }

      await recordAudit(trx, {
        entityType: "user",
        entityId: String(created.user_id),
        actionType: "user.create",
        userId: actorUserId,
        newValue: payload.email,
        note: ipAddress,
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
    role: resolveRole(payload.role),
    isActive: user.is_active,
    mustChangePassword: user.must_change_password,
    createdAt: user.created_at.toISOString(),
    temporaryPassword,
  } satisfies CreateUserResponse;
}

export async function changeUserStatus(
  rawId: string,
  payload: ChangeUserStatusRequest,
  actorUserId: number,
  ipAddress: string | undefined,
): Promise<ChangeUserStatusResponse> {
  const id = parseUserId(rawId);

  if (id === actorUserId) {
    throw new AppError("Você não pode modificar a própria conta", 400);
  }

  const user = await repository.findUserById(id);
  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  assertRoleIsManageable(resolveRole(user.profile_name));

  // Update e evento de auditoria na MESMA transação: se o evento falhar,
  // a mudança de status é desfeita (rollback).
  await db.transaction(async (trx) => {
    await repository.updateStatus(trx, id, payload.isActive);

    await recordAudit(trx, {
      entityType: "user",
      entityId: String(id),
      actionType: payload.isActive ? "user.activate" : "user.deactivate",
      userId: actorUserId,
      previousValue: String(user.is_active),
      newValue: String(payload.isActive),
      note: ipAddress,
      changeOrigin: CHANGE_ORIGIN_ADMIN,
    });
  });

  return { id: String(id), isActive: payload.isActive };
}

export async function resetPassword(
  rawId: string,
  actorUserId: number,
  ipAddress: string | undefined,
): Promise<ResetPasswordResponse> {
  const id = parseUserId(rawId);

  if (id === actorUserId) {
    throw new AppError("Você não pode modificar a própria conta", 400);
  }

  const user = await repository.findUserById(id);
  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  assertRoleIsManageable(resolveRole(user.profile_name));

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
      userId: actorUserId,
      note: ipAddress,
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

/**
 * `GET /users/me` — perfil completo do próprio usuário
 * (dados básicos + bloco requester + bloco professional [analista] + avatar).
 */
export async function getMyProfile(userId: number): Promise<UserProfileResponseDTO> {
  const row = await repository.findUserProfile(userId);
  if (!row) {
    throw new AppError("Usuário não encontrado", 404);
  }

  // Analista legado (sem linha em details_professional) recebe o bloco
  // professional com defaults em vez de null — o contrato do "Meus dados"
  // exige o bloco para o perfil Analista, sem erro e sem exigir migração
  // de dados. Demais perfis permanecem com professional: null.
  const professional: ProfessionalProfileBlock | null =
    row.profile_name === ROLE_ANALYST && !row.professional
      ? { jobTitle: null, specialties: [], attendedCategoryIds: [], notes: null }
      : toProfessionalBlock(row.professional);

  return {
    id: String(row.user_id),
    fullName: row.full_name,
    email: row.email,
    role: resolveRole(row.profile_name),
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
 * autoeditáveis. O próprio Administrador também pode editar seus dados
 * administrativos de requester. Dados profissionais continuam pertencendo
 * ao fluxo administrativo em `PUT /users/:id`.
 */
export async function updateMyProfile(
  userId: number,
  actorUserId: number,
  payload: UpdateProfilePayload,
  avatarFile?: Express.Multer.File,
): Promise<UserProfileResponseDTO> {
  // Self-service apenas.
  if (actorUserId !== userId) {
    throw new AppError("Você não pode editar o perfil de outro usuário", 403);
  }

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

      // A autorização usa o perfil persistido no banco, não apenas o JWT.
      if (changesAdministrativeFields && resolveRole(user.profile_name) !== "Administrador") {
        throw new AppError(
          "Área, departamento e gestor só podem ser alterados por administrador. Use PUT /users/:id.",
          403,
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
      userId: actorUserId,
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
 * `PUT /users/:id` — edição completa admin-only (merge). Atualiza
 * `fullName`, `email`, `role`, `professional` e `requester` de forma
 * parcial (ausente mantém). Auditoria `user.update`, transação atômica.
 * Exceção para Administrador alvo: só `requester` pode ser alterado.
 */
export async function updateUser(
  rawId: string,
  payload: UpdateUserRequest,
  actorUserId: number,
  ipAddress: string | undefined,
): Promise<UserProfileResponseDTO> {
  const id = parseUserId(rawId);

  if (id === actorUserId) {
    throw new AppError("Você não pode modificar a própria conta", 400);
  }

  const target = await repository.findUserById(id);
  if (!target) {
    throw new AppError("Usuário não encontrado", 404);
  }

  const isTargetAdmin = resolveRole(target.profile_name) === "Administrador";
  const hasNonRequesterPatch =
    payload.fullName !== undefined ||
    payload.email !== undefined ||
    payload.role !== undefined ||
    payload.professional !== undefined;

  if (isTargetAdmin && hasNonRequesterPatch) {
    throw new AppError("Não é possível gerenciar contas de Administradores", 403);
  }

  // Valida novo role se informado, bloqueando criação/promoção para Administrador.
  let newProfileId: number | undefined;
  if (payload.role !== undefined) {
    const pid = await repository.findProfileIdByName(payload.role);
    if (pid === null) {
      throw new AppError("Perfil inválido.", 400);
    }
    const role = resolveRole(payload.role);
    assertRoleIsManageable(role);
    newProfileId = pid;
  }

  const finalRoleName = payload.role ?? target.profile_name;
  const isFinalAnalyst = repository.isProfessionalProfile(finalRoleName);
  const wasAnalyst = repository.isProfessionalProfile(target.profile_name);

  if (payload.professional !== undefined && !isFinalAnalyst) {
    throw new AppError("Dados profissionais são exclusivos do perfil Analista", 400);
  }
  if (isFinalAnalyst && !wasAnalyst && payload.professional === undefined) {
    // Promoção para analista sem dados profissionais — exigir bloco.
    throw new AppError("Dados profissionais são obrigatórios para o perfil Analista", 400);
  }
  if (
    payload.professional !== undefined &&
    !repository.isProfessionalProfile(payload.role ?? target.profile_name)
  ) {
    // Role não-analista com professional já tratado acima; guarda extra para caso role ausente.
    throw new AppError("Dados profissionais são exclusivos do perfil Analista", 400);
  }

  // Snapshot para auditoria
  const before = await repository.findUserProfile(id);

  try {
    await db.transaction(async (trx) => {
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

      // 3. Professional (1:1) — merge
      if (payload.professional !== undefined) {
        await repository.upsertProfessionalData(trx, id, payload.professional);
      } else if (wasAnalyst && !isFinalAnalyst) {
        await repository.deleteProfessionalData(trx, id);
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
        userId: actorUserId,
        previousValue: JSON.stringify(before ?? null),
        newValue: JSON.stringify(payload),
        note: ipAddress,
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
  return {
    id: String(updated.user_id),
    fullName: updated.full_name,
    email: updated.email,
    role: resolveRole(updated.profile_name),
    avatarUrl: updated.avatar_url,
    requester: toRequesterBlock(updated.requester),
    professional: (() => {
      if (updated.profile_name === ROLE_ANALYST && !updated.professional) {
        return { jobTitle: null, specialties: [], attendedCategoryIds: [], notes: null };
      }
      return toProfessionalBlock(updated.professional);
    })(),
  } satisfies UserProfileResponseDTO;
}
