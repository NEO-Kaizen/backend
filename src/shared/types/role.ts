export const ROLES = ["Analista", "Gestor", "Administrador"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}


const DB_ROLES = [...ROLES, "Solicitante"] as const;
//Role from Database cells
export type RoleCell = (typeof DB_ROLES)[number];

export const ROLES_MAP : Record<number, Role> ={
  2: "Analista",
  3: "Administrador",
  4: "Gestor"
} 

export const DB_ROLES_MAP: Record<number, RoleCell> = {
  1:"Analista",
  ...ROLES_MAP
}