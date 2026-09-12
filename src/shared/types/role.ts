export const ROLES = ["Solicitante", "Analista", "Gestor", "Administrador"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export const ROLES_MAP: Record<number, Role> = {
  1: "Solicitante",
  2: "Analista",
  3: "Administrador",
  4: "Gestor",
};
