import type { PermissionKey } from "../catalog/permissionCatalog.ts";

/**
 * Seções da visão administrativa do portal e a chave de leitura que libera cada
 * uma (contrato RBAC § 3.7). Fonte única das chaves: o gate de
 * `GET /portal-config/sections` e a projeção da resposta leem daqui. Ao mudar
 * uma chave, atualize também as descrições em `src/docs/paths/portalConfig.ts`
 * e `src/docs/schemas/portal.ts`.
 */
export const PORTAL_SECTION_READ_KEY = {
  portalSetting: "portal_setting:read",
  theme: "theme:read",
  category: "category:read",
  status: "status:read",
  prioritizationConfig: "prioritization_config:read",
} as const satisfies Record<string, PermissionKey>;

/** Chaves que dão acesso à visão administrativa do portal. */
export const PORTAL_SECTION_READ_KEYS: readonly PermissionKey[] =
  Object.values(PORTAL_SECTION_READ_KEY);
