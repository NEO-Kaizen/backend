import type { User } from "../../types/user.ts";
import * as authRepository from "./auth_repository.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { comparePassword } from "../../shared/utils/passwordHandler.ts";
import type { TokenPayload } from "../../shared/utils/jwtUtil.ts";

export async function findUser(user: User) {
  const foundUser = await authRepository.userFind(user);

  if (!foundUser) {
    throw new AppError("Credenciais inválidas", 401);
  }

  const isPasswordValid = await comparePassword(user.password, foundUser.password);

  if (!isPasswordValid) throw new AppError("Credenciais inválidas", 401);

  return {
    email: foundUser.email,
    id: foundUser.id,
    name: foundUser.name,
    role: foundUser.role,
  } as TokenPayload;
}
