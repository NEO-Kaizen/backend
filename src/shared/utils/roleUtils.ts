import type { Role } from "../types/role.ts";

/** Mapa de exibição dos Perfis base; Perfis customizados preservam o nome do banco. */
const PROFILE_NAME_TO_ROLE: Record<string, Role> = {
  solicitante: "Solicitante",
  analista: "Analista",
  gestor: "Gestor",
  administrador: "Administrador",
  admin_root: "Admin Root",
};

/** Converte `profiles.name` do banco no nome legível, sem restringir perfis customizados. */
export function resolveRole(profileName: string): Role {
  const normalizedName = profileName.trim();
  return PROFILE_NAME_TO_ROLE[normalizedName.toLowerCase()] ?? normalizedName;
}
