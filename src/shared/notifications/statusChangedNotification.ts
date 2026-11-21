import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import type { StatusChangedNotificationPayload } from "./notificationEvents.ts";

/** Fluxo que mudou o Status — define o prefixo da `eventKey`. */
export type StatusChangeFlow = "manual_patch" | "triage_verdict";

const EVENT_KEY_PREFIXES: Record<StatusChangeFlow, string> = {
  manual_patch: "request.status_change",
  triage_verdict: "request.triage",
};

export interface StatusChangedNotificationInput extends Omit<
  StatusChangedNotificationPayload,
  "type"
> {
  flow: StatusChangeFlow;
  /** `audit_id` do evento de negócio; junto do fluxo forma a `eventKey`. */
  auditId: string;
  requestId: string;
  actorUserId: number;
  requesterUserId: number | null;
  /** Visibilidade do Status de destino, usada pela regra de audiência. */
  destination: {
    isPublic: boolean;
    isRestricted: boolean;
  };
}

/**
 * Emite o Evento "Status mudou" para o solicitante autenticado.
 *
 * Regra da matriz de audiência (issue #156): só Status público e não restrito
 * gera Notificação; quem não agiu recebe; o ator é removido pelo emissor;
 * solicitante anônimo não tem canal in-app na v1. A decisão de *se o Status
 * mudou* pertence ao service de cada fluxo.
 */
export async function emitStatusChangedNotification(
  trx: Knex.Transaction,
  input: StatusChangedNotificationInput,
): Promise<CommittedNotification[]> {
  if (input.requesterUserId === null) return [];
  if (!input.destination.isPublic || input.destination.isRestricted) return [];

  return emitNotification(trx, {
    type: "status_changed",
    eventKey: `${EVENT_KEY_PREFIXES[input.flow]}:${input.auditId}`,
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
