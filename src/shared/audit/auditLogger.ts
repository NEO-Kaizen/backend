import db from "../../database/conection.ts";
import {
  auditCatalog,
  isAuditEntityName,
  isComposedAuditAction,
  type AuditEntityName,
  type ComposedAuditAction,
} from "./auditCatalog.ts";

export interface AuditEntryBase {
  /** Identificador da entidade afetada. */
  entityId: string;
  /** Ator (quem executou). Nulo para ações de sistema. */
  userId: number | null;
  /** Valor anterior (texto livre), ex.: is_active antes. */
  previousValue?: string | null;
  /** Valor novo (texto livre), ex.: is_active depois. */
  newValue?: string | null;
  note?: string | null;
  changeOrigin?: string | null;
}

/**
 * Evento de auditoria tipado: `actionType` é restrito às ações válidas
 * da `entityType` escolhida (veja `auditCatalog`).
 */
export type AuditEntry<
  E extends AuditEntityName = AuditEntityName,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };

/**
 * Registra um evento de auditoria na `audit_history`.
 *
 * Best-effort: falha na gravação nunca deve abortar a operação de negócio —
 * o erro é apenas logado no console.
 *
 * Tipos inválidos (fora do `auditCatalog`) são rejeitados em runtime com
 * um log — não gravam nada nem abortam a operação.
 */
export async function recordAudit<E extends AuditEntityName, A extends ComposedAuditAction<E>>(
  entry: AuditEntryBase & { entityType: E; actionType: A },
): Promise<void> {
  if (
    !isAuditEntityName(entry.entityType) ||
    !isComposedAuditAction(entry.entityType, entry.actionType)
  ) {
    console.error(
      `[Auditoria] entidade/ação de auditoria desconhecida: "${entry.entityType}" / "${entry.actionType}"`,
    );
    return;
  }

  try {
    await db("audit_history").insert({
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action_type: entry.actionType,
      user_id: entry.userId,
      previous_value: entry.previousValue ?? null,
      new_value: entry.newValue ?? null,
      note: entry.note ?? null,
      change_origin: entry.changeOrigin ?? null,
    });
  } catch (error) {
    console.error("[Auditoria] Falha ao registrar evento:", error);
  }
}

export { auditCatalog };
export type { AuditEntityName, ComposedAuditAction } from "./auditCatalog.ts";
