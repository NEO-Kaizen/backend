export const ROLES = ["Solicitante", "Analista", "Gestor", "Administrador", "Admin Root"] as const;

/** Perfis customizados também chegam às respostas e ao token como nome legível. */
export type Role = (typeof ROLES)[number] | (string & {});

export function isRole(value: string): value is Role {
  return value.trim().length > 0;
}
