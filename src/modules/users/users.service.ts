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

      // Issue B (#108): todo usuário é requester → a extensão 1:1 nasce junto
      // com a conta. Mesmo trx da criação: se falhar, o usuário não é criado
      // (rollback consistente com auditoria e qualquer outra extensão).
      await repository.createRequesterData(trx, created);

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

function toRequesterBlock(row: repository.UserProfileRow["requester"]): RequesterProfileBlock | null {
  if (!row) return null;
  return {
    area: row.area,
    department: row.department,
    manager: row.manager_name,
    additionalContact: row.additional_contact,
  };
}

function toProfessionalBlock(row: repository.UserProfileRow["professional"]): ProfessionalProfileBlock | null {
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

  return {
    id: String(row.user_id),
    fullName: row.full_name,
    email: row.email,
    role: resolveRole(row.profile_name),
    avatarUrl: row.avatar_url,
    requester: toRequesterBlock(row.requester),
    professional: toProfessionalBlock(row.professional),
  } satisfies UserProfileResponseDTO;
}

/**
 * `PUT /users/me` — atualiza bloco requester, bloco professional (analista)
 * e/ou foto de perfil. Tudo na mesma transação (rollback atômico com
 * auditoria). Atua como o próprio usuário (self-service); qualquer outro
 * actor → 403.
 *
 * Decisão de domínio: campos imutáveis por esta issue (`fullName`,
 * `email`, `role`) são ignorados mesmo que presentes no payload.
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

  const user = await repository.findUserById(userId);
  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  // Snapshot anterior para auditoria (requester, professional, avatar).
  const snapshot = await repository.findUserProfile(userId);
  const previousValue = {
    requester: snapshot?.requester ?? null,
    professional: snapshot?.professional ?? null,
    avatarUrl: snapshot?.avatar_url ?? null,
    removeAvatar: payload.removeAvatar ?? false,
  };

  await db.transaction(async (trx) => {
    // ----- bloco requester -----
    if (payload.requester) {
      await repository.upsertRequesterData(trx, userId, {
        fullName: user.full_name,
        corporateEmail: user.email.trim().toLowerCase(),
        area: payload.requester.area,
        department: payload.requester.department,
        managerName: payload.requester.manager,
        additionalContact: payload.requester.additionalContact,
      });
    }

    // ----- bloco professional (apenas analista) -----
    if (payload.professional) {
      if (user.profile_name !== ROLE_ANALYST) {
        throw new AppError("Dados profissionais são exclusivos do perfil Analista", 400);
      }
      await repository.upsertProfessionalData(trx, userId, payload.professional);
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
        requester: payload.requester ?? null,
        professional: payload.professional ?? null,
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
