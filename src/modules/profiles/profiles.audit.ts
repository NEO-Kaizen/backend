import type { Knex } from "knex";
import { recordAudit, type ComposedAuditAction } from "../../shared/audit/auditLogger.ts";
import type { EffectivePermission } from "../../shared/catalog/permissionCatalog.ts";
import type { ProfileWithUserCountRow } from "../../shared/types/profile.ts";
import { profileSnapshot } from "./profiles.composition.ts";

/**
 * Auditoria de Perfis — um único ponto para as cinco ações do catálogo.
 *
 * O evento é gravado na MESMA transação da alteração (`recordAudit`), com o
 * ator da sessão e o antes/depois canônico (`profileSnapshot`). O Perfil não
 * tem snapshots parciais: toda ação registra o estado completo resultante.
 */

export type ProfileAuditAction = ComposedAuditAction<"profile">;

export interface ProfileAuditEntry {
  actorUserId: number;
  profileId: number;
  actionType: ProfileAuditAction;
  /** `null` em criação e duplicação. */
  previous: ProfileWithUserCountRow | null;
  next: ProfileWithUserCountRow;
  permissions: readonly EffectivePermission[];
  ipAddress: string | undefined;
  /** Justificativa interna, quando a ação tiver uma (ex.: origem da duplicação). */
  note?: string | null;
}

function snapshotOf(
  row: ProfileWithUserCountRow,
  permissions: readonly EffectivePermission[],
): string {
  return profileSnapshot({
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    isRoot: row.is_root,
    isAssignableTriage: row.is_assignable_triage,
    isAssignableMapping: row.is_assignable_mapping,
    permissions,
  });
}

export async function recordProfileAudit(
  trx: Knex.Transaction,
  entry: ProfileAuditEntry,
): Promise<void> {
  await recordAudit(trx, {
    entityType: "profile",
    entityId: String(entry.profileId),
    actionType: entry.actionType,
    userId: entry.actorUserId,
    previousValue: entry.previous ? snapshotOf(entry.previous, entry.permissions) : null,
    newValue: snapshotOf(entry.next, entry.permissions),
    note: entry.note ?? null,
    ipAddress: entry.ipAddress,
    changeOrigin: "admin",
  });
}
