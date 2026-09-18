/** Resposta de `GET /portal-config` — config consolidada (pública). */
export type PortalConfigResponse = import("../../../shared/types/portalConfig.ts").PortalConfig;

/** Recortes retornados por cada `PATCH` de seção. */
export type {
  AssetsSection,
  CategoriesSection,
  IdentitySection,
  PrioritizationWeightsSection,
  StatusesSection,
  ThemeSection,
} from "../../../shared/types/portalConfig.ts";
