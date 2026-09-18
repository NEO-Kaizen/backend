/**
 * Catálogo único de auditoria — fonte de verdade para entidades e ações.
 *
 * COMO USAR: ao chamar `recordAudit`, o autocomplete do editor mostra as
 * entidades (`entityType`) e restringe as ações (`actionType`) válidas da
 * entidade escolhida. Digitar algo fora do catálogo é erro de tipo (e o
 * guard de runtime rejeita valores dinâmicos antes do INSERT).
 *
 * Convenção de `actionType`: sempre `<entidade>.<ação>`, e o valor é
 * COMPOSTO automaticamente a partir deste catálogo — nunca digite
 * `"user.deactivate"` na mão em outro lugar.
 */
export const auditCatalog = {
  user: {
    label: "Usuários",
    actions: ["create", "activate", "deactivate", "reset_password", "change_password"],
  },
  prioritization: {
    label: "Priorização",
    actions: ["evaluate"],
  },
  request: {
    label: "Solicitações",
    actions: ["assign", "reassign", "unassign", "status_change"],
  },
  mapping: {
    label: "Mapeamento",
    actions: ["assign", "save", "complete"],
  },
  settings: {
    label: "Configuração do portal",
    actions: ["update"],
  },
} as const;

/** Nome de entidade auditável — ex.: "user". */
export type AuditEntityName = keyof typeof auditCatalog;

/** Ação curta válida de uma entidade — ex.: "deactivate". */
export type AuditActionOf<E extends AuditEntityName> = (typeof auditCatalog)[E]["actions"][number];

/** `actionType` composto e já restrito — ex.: "user.deactivate". */
export type ComposedAuditAction<E extends AuditEntityName> = `${E}.${AuditActionOf<E>}`;

/** Guard de runtime para `entityType` (protege valores dinâmicos). */
export function isAuditEntityName(value: string): value is AuditEntityName {
  return Object.prototype.hasOwnProperty.call(auditCatalog, value);
}

/** Guard de runtime para `actionType` composto de uma determinada entidade. */
export function isComposedAuditAction<E extends AuditEntityName>(
  entity: E,
  value: string,
): value is ComposedAuditAction<E> {
  return (auditCatalog[entity].actions as readonly string[]).some(
    (action) => value === `${entity}.${action}`,
  );
}
