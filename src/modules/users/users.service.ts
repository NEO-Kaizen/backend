import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import type { UserRow } from "../../shared/types/user.ts";
import { profileRole } from "../../shared/utils/roleUtils.ts";
import type { Role } from "../../shared/types/role.ts";
import { generateTemporaryPassword, hashPassword } from "../../shared/utils/passwordHandler.ts";
import type {
  ChangeUserStatusRequest,
  CreateUserRequest,
  ListUsersQuery,
} from "../DTOs/users/UserRequests.dto.ts";
import type {
  ChangeUserStatusResponse,
  CreateUserResponse,
  ResetPasswordResponse,
  UserSummary,
} from "../DTOs/users/UserResponse.dto.ts";
import * as repository from "./users.repository.ts";

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
  assertRoleIsManageable(profileRole(profileId));

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
    role: profileRole(user.profile_id),
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

  assertRoleIsManageable(profileRole(user.profile_id));

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

  assertRoleIsManageable(profileRole(user.profile_id));

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
