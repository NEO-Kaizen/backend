/**
 * Catálogo de Permissões — fonte única do vocabulário `recurso:ação` do RBAC.
 *
 * Módulo de domínio puro: sem HTTP, sem banco e sem configuração. O seed dos
 * perfis base, a sessão (`GET /auth/me`) e as guardas de composição consomem
 * este módulo; nenhuma outra cópia das 37 chaves existe no código.
 *
 * Contrato: `docs/rbac.md` (§§ 1–3).
 */

/** Vínculos de linha do contrato: `global`, posse (`own`), custódia (`assigned`) e todas (`all`). */
export const CUSTODIES = ["global", "own", "assigned", "all"] as const;

export type Custody = (typeof CUSTODIES)[number];

/** Tipo de custódia da chave: `global` não depende de linha; `custodial` depende. */
export type CustodyType = "global" | "custodial";

export interface PermissionDefinition {
  /** Chave `recurso:ação`, o vocabulário único de acesso. */
  readonly key: string;
  /** Se a chave depende da linha (`custodial`) ou não (`global`). */
  readonly custodyType: CustodyType;
  /**
   * Vínculos aceitos pela chave. Chave `global` aceita só `global`; chave
   * custodial aceita `assigned`/`all`, exceto as de posse fixa (`own`).
   */
  readonly allowedCustodies: readonly Custody[];
  /** Chaves que a composição precisa conter junto (§ 1.7 do contrato). */
  readonly dependencies: readonly string[];
}

/**
 * As 37 chaves na ordem de referência da matriz de perfil (§ 4.1). A ordem é
 * contrato: a lista efetiva da sessão sai nesta sequência.
 */
export const PERMISSION_CATALOG = [
  // § 3.1 — Solicitação
  {
    key: "request:create",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["request:track"],
  },
  {
    key: "request:track",
    custodyType: "custodial",
    allowedCustodies: ["own"],
    dependencies: [],
  },
  {
    key: "request:read",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "request:write",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: ["request:read"],
  },
  {
    key: "request:assign",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: ["assignee_directory:read"],
  },
  {
    key: "request:status_change",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "request:status_override",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["request:status_change"],
  },
  // § 3.2 — Fila e relatórios
  {
    key: "queue:read",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "queue:export",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "reports:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  // § 3.3 — Triagem, mapeamento e priorização
  {
    key: "triage:read",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "triage:write",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "mapping:read",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "mapping:write",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "prioritization:write",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  // § 3.4 — Colaboração
  {
    key: "pending_item:read",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "pending_item:write",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "pending_item:review",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "pending_item:respond",
    custodyType: "custodial",
    allowedCustodies: ["own"],
    dependencies: ["request:track"],
  },
  {
    key: "internal_note:read",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  {
    key: "internal_note:write",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  // § 3.5 — Auditoria
  {
    key: "audit:read",
    custodyType: "custodial",
    allowedCustodies: ["assigned", "all"],
    dependencies: [],
  },
  // § 3.6 — Diretório, contas e perfis
  {
    key: "assignee_directory:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  {
    key: "user:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  {
    key: "user:manage",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["user:read", "profile:read"],
  },
  {
    key: "profile:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  {
    key: "profile:manage",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["profile:read"],
  },
  // § 3.7 — Portal
  {
    key: "theme:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  {
    key: "theme:manage",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["theme:read"],
  },
  {
    key: "category:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  {
    key: "category:manage",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["category:read"],
  },
  {
    key: "status:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  {
    key: "status:manage",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["status:read"],
  },
  {
    key: "portal_setting:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  {
    key: "portal_setting:manage",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["portal_setting:read"],
  },
  {
    key: "prioritization_config:read",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: [],
  },
  {
    key: "prioritization_config:manage",
    custodyType: "global",
    allowedCustodies: ["global"],
    dependencies: ["prioritization_config:read"],
  },
] as const satisfies readonly PermissionDefinition[];

export type PermissionKey = (typeof PERMISSION_CATALOG)[number]["key"];

export type CatalogEntry = (typeof PERMISSION_CATALOG)[number];

/** Predicados de Atribuibilidade (§ 1.4): flag do Perfil + estas chaves de trabalho. */
export const ASSIGNABILITY_PREDICATES = {
  triage: ["request:read", "triage:read", "triage:write"],
  mapping: ["request:read", "mapping:read", "mapping:write"],
} as const satisfies Record<string, readonly PermissionKey[]>;

const DEFINITION_BY_KEY = new Map<string, CatalogEntry>(
  PERMISSION_CATALOG.map((entry) => [entry.key, entry]),
);

const ORDER_BY_KEY = new Map<string, number>(
  PERMISSION_CATALOG.map((entry, index) => [entry.key, index]),
);

function requireCatalogEntry(key: string): CatalogEntry {
  const entry = DEFINITION_BY_KEY.get(key);

  if (!entry) {
    throw new Error(`Chave de permissão fora do catálogo: ${key}`);
  }

  return entry;
}

/** Entrada do catálogo para uma chave já validada. */
export function getPermissionEntry(key: PermissionKey): CatalogEntry {
  return requireCatalogEntry(key);
}

/** Posse fixa (§ 1.3): chave custodial que só aceita o vínculo `own`. */
export function isFixedOwn(entry: CatalogEntry): boolean {
  return entry.allowedCustodies.length === 1 && entry.allowedCustodies[0] === "own";
}

export function isCustody(value: string): value is Custody {
  return (CUSTODIES as readonly string[]).includes(value);
}

/** Concessão como lida do banco/borda: a string só vira `Custody` após validação. */
export interface PermissionGrantSource {
  readonly permission_key: string;
  readonly custody: string;
}

/** Permissão efetiva — o par `{ chave, vínculo }` devolvido pela sessão. */
export interface EffectivePermission {
  readonly key: PermissionKey;
  readonly custody: Custody;
}

/**
 * Converte as concessões persistidas de um Perfil na lista efetiva, na ordem do
 * catálogo. Chave fora do catálogo, vínculo desconhecido ou incoerente com a
 * chave são corrupção de dados — falha alto em vez de esconder a divergência.
 */
export function buildEffectivePermissions(
  grants: readonly PermissionGrantSource[],
): EffectivePermission[] {
  const seen = new Set<string>();
  const permissions: Array<EffectivePermission & { readonly order: number }> = [];

  for (const grant of grants) {
    const entry = requireCatalogEntry(grant.permission_key);

    if (!isCustody(grant.custody)) {
      throw new Error(
        `Vínculo de permissão inválido para '${grant.permission_key}': ${grant.custody}`,
      );
    }

    const allowedCustodies: readonly Custody[] = entry.allowedCustodies;

    if (!allowedCustodies.includes(grant.custody)) {
      throw new Error(
        `Vínculo '${grant.custody}' não permitido para a chave '${grant.permission_key}'`,
      );
    }

    if (seen.has(grant.permission_key)) {
      throw new Error(`Concessão duplicada para a chave '${grant.permission_key}'`);
    }
    seen.add(grant.permission_key);

    permissions.push({
      key: entry.key,
      custody: grant.custody,
      order: ORDER_BY_KEY.get(entry.key) ?? Number.MAX_SAFE_INTEGER,
    });
  }

  for (const permission of permissions) {
    for (const dependency of requireCatalogEntry(permission.key).dependencies) {
      if (!seen.has(dependency)) {
        throw new Error(`A permissão '${permission.key}' exige também '${dependency}'`);
      }
    }
  }

  permissions.sort((left, right) => left.order - right.order);

  return permissions.map(({ key, custody }) => ({ key, custody }));
}

/**
 * Invariantes do catálogo verificadas no carregamento do módulo: chave única,
 * coerência entre tipo e vínculos, e dependências apontando para chaves reais.
 */
function assertCatalogIntegrity(catalog: readonly PermissionDefinition[]): void {
  const keys = new Set<string>();

  for (const entry of catalog) {
    if (keys.has(entry.key)) {
      throw new Error(`Chave duplicada no catálogo: ${entry.key}`);
    }
    keys.add(entry.key);

    if (entry.allowedCustodies.length === 0) {
      throw new Error(`A chave '${entry.key}' não aceita nenhum vínculo`);
    }

    const acceptsGlobal = entry.allowedCustodies.includes("global");

    if (entry.custodyType === "global" && !acceptsGlobal) {
      throw new Error(`A chave global '${entry.key}' precisa aceitar o vínculo 'global'`);
    }

    if (entry.custodyType === "custodial" && acceptsGlobal) {
      throw new Error(`A chave custodial '${entry.key}' não pode aceitar o vínculo 'global'`);
    }
  }

  for (const entry of catalog) {
    for (const dependency of entry.dependencies) {
      if (!keys.has(dependency)) {
        throw new Error(`Dependência inexistente para '${entry.key}': ${dependency}`);
      }
    }
  }
}

assertCatalogIntegrity(PERMISSION_CATALOG);
