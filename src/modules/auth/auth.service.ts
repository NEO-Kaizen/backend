import * as authRepository from "./auth.repository.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { comparePassword } from "../../shared/utils/passwordHandler.ts";
import type { TokenPayload } from "../../shared/utils/jwtUtil.ts";
import type { LoginRequestDTO } from "../DTOs/auth/LoginRequest.dto.ts";

export async function findUser(user: LoginRequestDTO) {
  const foundUser = await authRepository.findUserByEmail(user);

  if (!foundUser) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const isPasswordValid = await comparePassword(user.password, foundUser.password_hash);

  if (!isPasswordValid) throw new AppError("Credenciais inválidas", 401);

  const roles: Record<number, string> = {
    2: "Analista",
    3: "Administrador",
    4: "Gestor",
  };

  return {
    email: foundUser.email,
    id: String(foundUser.user_id),
    name: foundUser.full_name,
    role: roles[foundUser.profile_id],
  } as TokenPayload;
}
