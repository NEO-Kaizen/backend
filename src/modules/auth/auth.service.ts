import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import type { Role } from "../../shared/types/role.ts";
import { profileRole } from "../../shared/utils/roleUtils.ts";
import { comparePassword, hashPassword } from "../../shared/utils/passwordHandler.ts";
import type { ChangePasswordRequest } from "../DTOs/auth/ChangePasswordRequest.dto.ts";
import type { LoginRequestDTO } from "../DTOs/auth/LoginRequest.dto.ts";
import * as authRepository from "./auth.repository.ts";

export interface SessionUserResult {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  /** Época (ms) de `users.password_changed_at` — vai no payload do JWT. */
  passwordChangedAt: number;
}

/** Hash de senha inválida usado para equalizar o tempo do bcrypt quando o
 *  usuário não existe ou está inativo — evita enumeração por timing. */
const DUMMY_PASSWORD_HASH = "$2b$10$jY9m/Fb6ZOB727amwsLEL.lRF6P2piXjpIvtnjTDSehPqw0ytGPEC";

export async function authenticate(credentials: LoginRequestDTO): Promise<SessionUserResult> {
  const email = credentials.email.trim().toLowerCase();

  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    await comparePassword(credentials.password, DUMMY_PASSWORD_HASH);
    throw new AppError("Credenciais inválidas", 401);
  }

  if (!user.is_active) {
    // Mantém o timing uniforme e a resposta pública idêntica à de e-mail
    // inexistente/senha errada — conta desativada não pode ser distinguida
    // por enumeração. O branch permanece apenas para impedir o login de
    // contas inativas, mesmo com a senha correta.
    await comparePassword(credentials.password, DUMMY_PASSWORD_HASH);
    throw new AppError("Credenciais inválidas", 401);
  }

  const isPasswordValid = await comparePassword(credentials.password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError("Credenciais inválidas", 401);
  }

  return {
    id: String(user.user_id),
    name: user.full_name,
    email: user.email,
    role: profileRole(user.profile_id),
    mustChangePassword: user.must_change_password,
    passwordChangedAt: new Date(user.password_changed_at).getTime(),
  };
}

export async function changePassword(
  userId: number,
  body: ChangePasswordRequest,
  ipAddress: string | undefined,
): Promise<SessionUserResult> {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  const isCurrentPasswordValid = await comparePassword(body.currentPassword, user.password_hash);

  if (!isCurrentPasswordValid) {
    throw new AppError("Senha atual incorreta", 401);
  }

  const isSamePassword = await comparePassword(body.newPassword, user.password_hash);

  if (isSamePassword) {
    throw new AppError("A nova senha deve ser diferente da atual.", 400);
  }

  const newPasswordHash = await hashPassword(body.newPassword);

  // Update e evento de auditoria na MESMA transação: se o evento falhar,
  // a troca de senha é desfeita (rollback).
  const { password_changed_at } = await db.transaction(async (trx) => {
    const result = await authRepository.changePassword(trx, user.user_id, newPasswordHash);

    await recordAudit(trx, {
      entityType: "user",
      entityId: String(user.user_id),
      actionType: "user.change_password",
      userId: user.user_id,
      note: ipAddress,
      changeOrigin: "user",
    });

    return result;
  });

  return {
    id: String(user.user_id),
    name: user.full_name,
    email: user.email,
    role: profileRole(user.profile_id),
    mustChangePassword: false,
    passwordChangedAt: new Date(password_changed_at).getTime(),
  };
}
