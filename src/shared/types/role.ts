export const ROLES = ["Solicitante", "Analista", "Gestor", "Administrador", "Admin Root"] as const;

export type Role = (typeof ROLES)[number];

/**
 * Nome do perfil em `profiles.name` (lowercase, configurável no banco):
 * "solicitante", "analista", "gestor", "administrador".
 *
 * Diferente de `Role`, que é o vocabulário de exibição capitalizado usado nas
 * respostas da API. A resolução entre os dois acontece em `resolveRole`.
 *
 * Alias apenas documental — não impõe os valores em nível de tipo.
 */
export type ProfileName = string;

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
