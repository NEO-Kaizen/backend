import db from "../../database/conection.ts";
import type { PermissionKey } from "../catalog/permissionCatalog.ts";
import { recordAudit } from "./auditLogger.ts";

export type AccessDeniedEntity = "request" | "queue" | "reports" | "prioritization";

export interface AccessDeniedAttempt {
  readonly entityType: AccessDeniedEntity;
  readonly entityId: string;
  readonly userId: number;
  readonly note: string;
  readonly ipAddress?: string;
  /**
   * Chaves de Permissão avaliadas na recusa: ausentes no gate ou presentes sem
   * o vínculo suficiente (Custódia ou Posse) na linha. Vazio quando a recusa não é de Permissão.
   */
  readonly deniedPermissionKeys?: readonly PermissionKey[];
}

export async function recordAccessDeniedAttempt(entry: AccessDeniedAttempt): Promise<void> {
  await db.transaction(async (trx) => {
    switch (entry.entityType) {
      case "request":
        await recordAudit(trx, {
          entityType: "request",
          actionType: "request.access_denied",
          entityId: entry.entityId,
          userId: entry.userId,
          previousValue: null,
          newValue: null,
          note: entry.note,
          ipAddress: entry.ipAddress,
          changeOrigin: "system",
          deniedPermissionKeys: entry.deniedPermissionKeys,
        });
        return;
      case "queue":
        await recordAudit(trx, {
          entityType: "queue",
          actionType: "queue.access_denied",
          entityId: entry.entityId,
          userId: entry.userId,
          previousValue: null,
          newValue: null,
          note: entry.note,
          ipAddress: entry.ipAddress,
          changeOrigin: "system",
          deniedPermissionKeys: entry.deniedPermissionKeys,
        });
        return;
      case "reports":
        await recordAudit(trx, {
          entityType: "reports",
          actionType: "reports.access_denied",
          entityId: entry.entityId,
          userId: entry.userId,
          previousValue: null,
          newValue: null,
          note: entry.note,
          ipAddress: entry.ipAddress,
          changeOrigin: "system",
          deniedPermissionKeys: entry.deniedPermissionKeys,
        });
        return;
      case "prioritization":
        await recordAudit(trx, {
          entityType: "prioritization",
          actionType: "prioritization.access_denied",
          entityId: entry.entityId,
          userId: entry.userId,
          previousValue: null,
          newValue: null,
          note: entry.note,
          ipAddress: entry.ipAddress,
          changeOrigin: "system",
          deniedPermissionKeys: entry.deniedPermissionKeys,
        });
        return;
    }
  });
}
