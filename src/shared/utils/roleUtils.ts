import { AppError } from "../errors/AppError.ts";
import type { Role } from "../types/role.ts";

/** Mapa canônico `profiles.name` (lowercase no banco) -> `Role` de exibição. */
const PROFILE_NAME_TO_ROLE: Record<string, Role> = {
  solicitante: "Solicitante",
  analista: "Analista",
  gestor: "Gestor",
  administrador: "Administrador",
};

/** Converte `profiles.name` do banco na `Role` do sistema, validando o valor.
 *  Nunca interpreta `profile_id` por posição fixa. */
export function resolveRole(profileName: string): Role {
  const role = PROFILE_NAME_TO_ROLE[profileName.trim().toLowerCase()];

  if (role === undefined) {
    throw new AppError("Perfil inválido", 500);
  }

  return role;
}
