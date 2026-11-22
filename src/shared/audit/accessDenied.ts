import db from "../../database/conection.ts";
import { recordAudit } from "./auditLogger.ts";

export type AccessDeniedEntity = "request" | "queue" | "reports";

export interface AccessDeniedAttempt {
  readonly entityType: AccessDeniedEntity;
  readonly entityId: string;
  readonly userId: number;
  readonly note: string;
  readonly ipAddress?: string;
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
        });
        return;
    }
  });
}
