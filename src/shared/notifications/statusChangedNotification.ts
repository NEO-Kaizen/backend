import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import type { StatusChangedNotificationPayload } from "./notificationEvents.ts";

/** Origem da mudança de Status — define o prefixo da `eventKey`. */
export type StatusChangeSource = "status_patch" | "triage_verdict";

const EVENT_KEY_PREFIXES: Record<StatusChangeSource, string> = {
  status_patch: "request.status_change",
  triage_verdict: "request.triage",
};

export interface StatusChangedNotificationInput extends Omit<
  StatusChangedNotificationPayload,
  "type"
> {
  source: StatusChangeSource;
  /** `audit_id` do evento de negócio; junto da origem forma a `eventKey`. */
  auditId: string;
  requestId: string;
  actorUserId: number;
  requesterUserId: number | null;
  /** Status anterior; igual ao destino significa que não houve mudança. */
  previousStatusId: number | null;
  /** Status de destino; a visibilidade decide a audiência. */
  targetStatus: {
    statusId: number;
    isPublic: boolean;
    isRestricted: boolean;
  };
}

/**
 * Emite o Evento "Status mudou" para o solicitante autenticado quando o
 * Status muda de fato para um destino público e não restrito.
 *
 * Regra da matriz de audiência (issue #156): só Status público e não restrito
 * gera Notificação; quem não agiu recebe; o ator é removido pelo emissor;
 * solicitante anônimo não tem canal in-app na v1.
 */
export async function emitStatusChangedNotification(
  trx: Knex.Transaction,
  input: StatusChangedNotificationInput,
): Promise<CommittedNotification[]> {
  if (input.requesterUserId === null) return [];
  if (input.previousStatusId === input.targetStatus.statusId) return [];
  if (!input.targetStatus.isPublic || input.targetStatus.isRestricted) return [];

  return emitNotification(trx, {
    type: "status_changed",
    eventKey: `${EVENT_KEY_PREFIXES[input.source]}:${input.auditId}`,
    requestId: input.requestId,
    actorUserId: input.actorUserId,
    recipientUserIds: [input.requesterUserId],
    payload: {
      type: "status_changed",
      protocol: input.protocol,
      title: input.title,
      newStatus: input.newStatus,
    },
  });
}
