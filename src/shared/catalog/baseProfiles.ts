import {
  getPermissionEntry,
  isFixedOwn,
  PERMISSION_CATALOG,
  type Custody,
  type PermissionKey,
} from "./permissionCatalog.ts";

/**
 * Matriz de referência dos cinco perfis base (§ 4.1 do contrato), consumida
 * pelo seed. Módulo de domínio puro: sem HTTP, sem banco e sem configuração.
 */

export interface BaseProfilePermission {
  readonly key: PermissionKey;
  readonly custody: Custody;
}

export interface BaseProfile {
  /** Rótulo de exibição atual em `profiles.name`. */
  readonly profileName: string;
  /** Marca de Perfil Admin Root — escrita exclusiva do seed (§ 4.2). */
  readonly isRoot: boolean;
  readonly isAssignableTriage: boolean;
  readonly isAssignableMapping: boolean;
  readonly permissions: readonly BaseProfilePermission[];
}

/** Vínculo aplicado às chaves custodiais que não têm posse fixa. */
type CustodialPolicy = Extract<Custody, "assigned" | "all">;

function resolveCustody(key: PermissionKey, policy: CustodialPolicy): Custody {
  const entry = getPermissionEntry(key);

  if (entry.custodyType === "global") {
    return "global";
  }

  // Posse fixa (`request:track`, `pending_item:respond`) só aceita `own` (§ 1.3).
  return isFixedOwn(entry) ? "own" : policy;
}

function grantPermissions(
  keys: readonly PermissionKey[],
  policy: CustodialPolicy,
): BaseProfilePermission[] {
  return keys.map((key) => ({ key, custody: resolveCustody(key, policy) }));
}

/** Composição "todas as chaves": globais em `global`, custodiais em `all`, posse fixa em `own`. */
function grantEveryPermission(): BaseProfilePermission[] {
  return PERMISSION_CATALOG.map((entry) => ({
    key: entry.key,
    custody: resolveCustody(entry.key, "all"),
  }));
}

export const BASE_PROFILES: readonly BaseProfile[] = [
  {
    // Coluna "Solicitante": as três chaves de autoatendimento, sem chave interna.
    profileName: "Solicitante",
    isRoot: false,
    isAssignableTriage: false,
    isAssignableMapping: false,
    permissions: grantPermissions(
      ["request:create", "request:track", "pending_item:respond"],
      "assigned",
    ),
  },
  {
    // Coluna "Analista": chaves internas sob custódia; atribuível nas duas etapas.
    profileName: "Analista",
    isRoot: false,
    isAssignableTriage: true,
    isAssignableMapping: true,
    permissions: grantPermissions(
      [
        "request:create",
        "request:track",
        "request:read",
        "request:write",
        "request:status_change",
        "queue:read",
        "triage:read",
        "triage:write",
        "mapping:read",
        "mapping:write",
        "prioritization:write",
        "pending_item:read",
        "pending_item:write",
        "pending_item:review",
        "pending_item:respond",
        "internal_note:read",
        "internal_note:write",
        "assignee_directory:read",
      ],
      "assigned",
    ),
  },
  {
    // Coluna "Visualizador" da matriz: leitura de todas as linhas e escrita de
    // Nota interna. A renomeação para Visualizador continua no ticket 12.
    profileName: "Gestor",
    isRoot: false,
    isAssignableTriage: false,
    isAssignableMapping: false,
    permissions: grantPermissions(
      [
        "request:create",
        "request:track",
        "request:read",
        "queue:read",
        "queue:export",
        "reports:read",
        "triage:read",
        "mapping:read",
        "pending_item:read",
        "pending_item:respond",
        "internal_note:read",
        "internal_note:write",
        "audit:read",
        "assignee_directory:read",
      ],
      "all",
    ),
  },
  {
    // Coluna "Administrador": as 37 chaves; não atribuível (§ 1.4).
    profileName: "Administrador",
    isRoot: false,
    isAssignableTriage: false,
    isAssignableMapping: false,
    permissions: grantEveryPermission(),
  },
  {
    // Coluna "Admin Root": mesmas chaves do Administrador; a diferença está nas
    // guardas de conta e de perfil (`is_root`), não na composição (§ 4.2).
    profileName: "Admin Root",
    isRoot: true,
    isAssignableTriage: false,
    isAssignableMapping: false,
    permissions: grantEveryPermission(),
  },
];

function assertBaseProfiles(profiles: readonly BaseProfile[]): void {
  const rootProfiles = profiles.filter((profile) => profile.isRoot);

  if (rootProfiles.length !== 1) {
    throw new Error("A matriz de perfis base precisa de exatamente um Perfil Admin Root");
  }

  const seenNames = new Set<string>();

  for (const profile of profiles) {
    if (seenNames.has(profile.profileName)) {
      throw new Error(`Perfil base duplicado na matriz: ${profile.profileName}`);
    }
    seenNames.add(profile.profileName);

    const seenKeys = new Set<string>();

    for (const grant of profile.permissions) {
      if (seenKeys.has(grant.key)) {
        throw new Error(`Chave duplicada no perfil base '${profile.profileName}': ${grant.key}`);
      }
      seenKeys.add(grant.key);
    }
  }
}

assertBaseProfiles(BASE_PROFILES);
