/** Resposta de `GET /portal-config` — config consolidada (pública). */
export type PortalConfigResponse = import("../../../shared/types/portalConfig.ts").PortalConfig;

/** Resposta de `GET /portal-config/sections` — seções legíveis pelo ator. */
export type { PortalSections } from "../../../shared/types/portalConfig.ts";

/** Recortes retornados por cada `PATCH` de seção. */
export type {
  AssetsSection,
  CategoriesSection,
  IdentitySection,
  PrioritizationWeightsSection,
  StatusesSection,
  ThemeSection,
} from "../../../shared/types/portalConfig.ts";
