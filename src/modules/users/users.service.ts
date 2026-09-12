import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import type { UserRow } from "../../shared/types/user.ts";
import { profileRole } from "../../shared/utils/roleUtils.ts";
import { generateTemporaryPassword, hashPassword } from "../../shared/utils/passwordHandler.ts";
import type {
  ChangeUserStatusRequest,
  CreateRequesterRequest,
  ListUsersQuery,
} from "../DTOs/users/UserRequests.dto.ts";
import type {
  ChangeUserStatusResponse,
  CreateRequesterResponse,
  ResetPasswordResponse,
  UserSummary,
} from "../DTOs/users/UserResponse.dto.ts";
import * as repository from "./users.repository.ts";

const SOLICITANTE_PROFILE = "solicitante";
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

export async function listUsers(query: ListUsersQuery): Promise<PaginatedResponse<UserSummary>> {
  if (query.profile) {
    const profileId = await repository.findProfileIdByName(query.profile);
    if (profileId === null) {
      throw new AppError("Perfil inválido.", 400);
    }
  }

  return repository.listUsers(query);
}

export async function createRequester(
  payload: CreateRequesterRequest,
  actorUserId: number,
  ipAddress: string | undefined,
): Promise<CreateRequesterResponse> {
  const profileId = await repository.findProfileIdByName(SOLICITANTE_PROFILE);
  if (profileId === null) {
    throw new AppError("Perfil 'solicitante' não configurado no sistema.", 500);
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  let user: UserRow | undefined;
  try {
    // Inserção e evento de auditoria na MESMA transação: se o registro do
    // evento falhar, a criação é desfeita (rollback) — nunca fica um usuário
    // sem histórico.
    user = await db.transaction(async (trx) => {
      const created = await repository.createRequester(
        trx,
        { fullName: payload.fullName, email: payload.email },
        passwordHash,
        profileId,
      );

      await recordAudit(trx, {
        entityType: "user",
        entityId: String(created.user_id),
        actionType: "user.create",
        userId: actorUserId,
        newValue: payload.email,
        note: ipAddress,
        changeOrigin: CHANGE_ORIGIN_ADMIN,
      });

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
    profile: profileRole(user.profile_id),
    isActive: user.is_active,
    mustChangePassword: user.must_change_password,
    createdAt: user.created_at.toISOString(),
    temporaryPassword,
  } satisfies CreateRequesterResponse;
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
