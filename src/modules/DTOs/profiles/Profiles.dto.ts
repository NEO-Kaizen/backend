import type {
  Custody,
  EffectivePermission,
  PermissionKey,
} from "../../../shared/catalog/permissionCatalog.ts";

/** Concessão submetida na criação/edição: a chave só vira `PermissionKey` após o service validar o catálogo. */
export interface ProfilePermissionInput {
  key: string;
  custody: Custody;
}

/** DTO de leitura de um Perfil — lista e detalhe usam a mesma forma. */
export interface ProfileDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  /** `true` apenas no próprio Perfil Admin Root (contrato RBAC § 4.2). */
  isRoot: boolean;
  isAssignableTriage: boolean;
  isAssignableMapping: boolean;
  /** Contas vinculadas — todas, inclusive inativas (guarda de desativação). */
  userCount: number;
  /** Composição efetiva na ordem do catálogo. */
  permissions: EffectivePermission[];
}

/** Entrada do catálogo de chaves para o editor de Perfis. */
export interface PermissionCatalogEntryDTO {
  key: PermissionKey;
  custodyType: "global" | "custodial";
  allowedCustodies: readonly Custody[];
  dependencies: readonly PermissionKey[];
}

/** Resposta de `GET /profiles/keys`. */
export interface PermissionCatalogResponse {
  /** As 39 chaves na ordem de referência da matriz. */
  permissions: PermissionCatalogEntryDTO[];
  /** Predicados de Atribuibilidade por etapa (flag + chaves de trabalho). */
  assignabilityPredicates: {
    triage: readonly PermissionKey[];
    mapping: readonly PermissionKey[];
  };
}

/** Corpo de `POST /profiles` — composição integral. */
export interface CreateProfileRequest {
  name: string;
  description?: string | null;
  isAssignableTriage?: boolean;
  isAssignableMapping?: boolean;
  permissions: ProfilePermissionInput[];
}

/** Corpo de `PATCH /profiles/:id` — parcial e atômico; `permissions` presente substitui tudo. */
export interface UpdateProfileRequest {
  name?: string;
  description?: string | null;
  isAssignableTriage?: boolean;
  isAssignableMapping?: boolean;
  permissions?: ProfilePermissionInput[];
}

/** Corpo de `PATCH /profiles/:id/status`. */
export interface ChangeProfileStatusRequest {
  isActive: boolean;
}

/** Corpo de `POST /profiles/:id/duplicate` — nome novo; descrição opcional (copia a da fonte). */
export interface DuplicateProfileRequest {
  name: string;
  description?: string | null;
}

/** Resposta de `PATCH /profiles/:id/status`. */
export interface ChangeProfileStatusResponse {
  id: string;
  isActive: boolean;
}
