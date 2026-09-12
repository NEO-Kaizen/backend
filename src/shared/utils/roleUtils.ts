import { AppError } from "../errors/AppError.ts";
import { ROLES_MAP, type Role } from "../types/role.ts";

/** Converte `profile_id` do banco na `Role` do sistema, validando o valor. */
export function profileRole(profileId: number): Role {
  const role = ROLES_MAP[profileId];

  if (role === undefined) {
    throw new AppError("Perfil inválido", 500);
  }

  return role;
}
