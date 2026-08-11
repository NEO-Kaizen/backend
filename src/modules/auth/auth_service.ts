import type { User } from "../../types/user.ts";
import * as authRepository from "./auth_ repository.ts";
import { HttpError } from "../../errors/httpError.ts";
import { comparePassword } from "../../shared/utils/passwordHandler.ts";

export async function foundUser(user: User) {
  const found = await authRepository.userFind(user);

  if (!found) {
    throw new HttpError("Credenciais inválidas", 400);
  }

  const isPasswordValid = await comparePassword(user.password, found.password);

  return isPasswordValid;
}
