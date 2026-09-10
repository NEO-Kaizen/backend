import * as authRepository from "./auth.repository.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { comparePassword } from "../../shared/utils/passwordHandler.ts";
import type { TokenPayload } from "../../shared/utils/jwtUtil.ts";
import type { LoginRequestDTO } from "../DTOs/auth/LoginRequest.dto.ts";
import { ROLES_MAP } from "../../shared/types/role.ts";

export async function findUser(user: LoginRequestDTO) {
  const foundUser = await authRepository.findUserByEmail(user);

  if (!foundUser) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const isPasswordValid = await comparePassword(user.password, foundUser.password_hash);

  if (!isPasswordValid) throw new AppError("Credenciais inválidas", 401);

  return {
    email: foundUser.email,
    id: foundUser.user_id,
    name: foundUser.full_name,
    role: ROLES_MAP[foundUser.profile_id],
  } as TokenPayload;
}
