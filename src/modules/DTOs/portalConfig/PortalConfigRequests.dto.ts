import type {
  AssetKey,
  CategoriesSection,
  PrioritizationWeightsSection,
  StatusesSection,
  ThemeSection,
} from "../../../shared/types/portalConfig.ts";

/** Corpo de `PATCH /portal-config/access` (Card 1). */
export interface UpdateAccessRequest {
  solicitationMode: "PUBLIC" | "AUTHENTICATED";
}

/** Corpo de `PATCH /portal-config/identity` (Card 2) — campos parciais. */
export interface UpdateIdentityRequest {
  platformName?: string;
  protocolMask?: string;
}

/** Corpo de `PATCH /portal-config/theme` (Card 3) — atômico. */
export interface UpdateThemeRequest {
  theme: ThemeSection["theme"];
}

/**
 * Parte JSON `assets` do `PATCH /portal-config/assets` (Card 4):
 * chaves com a URL definida diretamente (reset/URL existente) + flag opcional
 * de cor primária do logo (contrato `portal-config-api2.md`).
 */
export type PortalAssetsPatchDto = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};

/** Corpo de `PATCH /portal-config/categories` (Card 5) — lista atômica. */
export interface UpdateCategoriesRequest {
  categories: CategoriesSection["categories"];
}

/** Corpo de `PATCH /portal-config/statuses` (Card 6) — lista atômica. */
export interface UpdateStatusesRequest {
  statuses: StatusesSection["statuses"];
}

/** Corpo de `PATCH /portal-config/prioritization-weights` (Card 7). */
export interface UpdatePrioritizationWeightsRequest {
  prioritizationWeights: PrioritizationWeightsSection["prioritizationWeights"];
}

// Reusados nas respostas:
export type {
  AccessSection,
  IdentitySection,
  ThemeSection,
  AssetsSection,
  CategoriesSection,
  StatusesSection,
  PrioritizationWeightsSection,
} from "../../../shared/types/portalConfig.ts";
