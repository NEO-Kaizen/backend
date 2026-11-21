import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";

/** Fluxo que mudou o Status — define o prefixo da `eventKey`. */
export type StatusChangeSource = "status_change" | "triage";

const EVENT_KEY_PREFIXES: Record<StatusChangeSource, string> = {
  status_change: "request.status_change",
  triage: "request.triage",
};

export interface StatusChangedNotificationInput {
  source: StatusChangeSource;
  /** `audit_id` do evento de negócio; junto da origem forma a `eventKey`. */
  auditId: string;
  requestId: string;
  protocol: string;
  title: string;
  newStatus: string;
  actorUserId: number;
  requesterUserId: number | null;
}

/**
 * Emite o Evento "Status mudou" para o solicitante autenticado.
 *
 * Regra da matriz de audiência (issue #156): quem não agiu recebe; o ator é
 * removido pelo emissor; solicitante anônimo não tem canal in-app na v1.
 * A decisão de *quando* notificar (Status público, não restrito e com mudança
 * efetiva) pertence ao service de cada fluxo.
 */
export async function emitStatusChangedNotification(
  trx: Knex.Transaction,
  input: StatusChangedNotificationInput,
): Promise<CommittedNotification[]> {
  if (input.requesterUserId === null) return [];

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
