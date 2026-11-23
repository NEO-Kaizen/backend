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

/**
 * Estado completo de um Perfil na trilha: a linha e a composição vigente
 * NAQUELE momento. Cada lado carrega a própria composição — o "antes" nunca
 * pode herdar as Permissões do "depois" numa edição de composição.
 */
export interface ProfileAuditState {
  row: ProfileWithUserCountRow;
  permissions: readonly EffectivePermission[];
}

export interface ProfileAuditEntry {
  actorUserId: number;
  profileId: number;
  actionType: ProfileAuditAction;
  /** Estado anterior; `null` em criação e duplicação. */
  previous: ProfileAuditState | null;
  next: ProfileAuditState;
  ipAddress: string | undefined;
  /** Justificativa interna, quando a ação tiver uma (ex.: origem da duplicação). */
  note?: string | null;
}

function snapshotOf(state: ProfileAuditState): string {
  return profileSnapshot({
    name: state.row.name,
    description: state.row.description,
    isActive: state.row.is_active,
    isRoot: state.row.is_root,
    isAssignableTriage: state.row.is_assignable_triage,
    isAssignableMapping: state.row.is_assignable_mapping,
    permissions: state.permissions,
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
    previousValue: entry.previous ? snapshotOf(entry.previous) : null,
    newValue: snapshotOf(entry.next),
    note: entry.note ?? null,
    ipAddress: entry.ipAddress,
    changeOrigin: "admin",
  });
}
