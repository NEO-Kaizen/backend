import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import {
  PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
  type NotificationEvent,
  type RequestPointer,
} from "./notificationEvents.ts";

const EVENT_KEY_PREFIX = "request.pending_responded";

/** Audiência resolvida: Responsável designado ou Administradores ativos. */
export type PendingItemRespondedAudience =
  { kind: "assignee"; userId: number } | { kind: "active_admins"; userIds: readonly number[] };

export interface PendingItemRespondedNotificationInput {
  /** `audit_id` da resposta; junto do prefixo forma a `eventKey`. */
  auditId: string;
  requestId: string;
  /** Protocolo e título da solicitação — ponteiro da Allowlist. */
  requestPointer: RequestPointer;
  /** Ator da resposta; `null` em solicitação anônima sem usuário vinculado. */
  actorUserId: number | null;
  /** Resolvida pelo chamador antes da emissão. */
  audience: PendingItemRespondedAudience;
}

/**
 * Emite o Evento "Pendência respondida" na matriz de audiência do RF20.
 *
 * - Com Responsável designado: notifica o Responsável pela solicitação.
 * - Sem Responsável: notifica os Administradores ativos, com o aviso
 *   explícito de que a solicitação está sem responsável.
 *
 * A autoexclusão do ator tem precedência: quando o Responsável é quem
 * responde, o Evento não é emitido. O payload é um ponteiro com os campos da
 * Allowlist.
 */
export async function emitPendingItemRespondedNotification(
  trx: Knex.Transaction,
  input: PendingItemRespondedNotificationInput,
): Promise<CommittedNotification[]> {
  const event = buildPendingItemRespondedEvent(input);
  if (!event) return [];
  return emitNotification(trx, event);
}

function buildPendingItemRespondedEvent(
  input: PendingItemRespondedNotificationInput,
): NotificationEvent | null {
  const eventBase = {
    eventKey: `${EVENT_KEY_PREFIX}:${input.auditId}`,
    requestId: input.requestId,
    actorUserId: input.actorUserId,
  };
  const payloadBase = {
    protocol: input.requestPointer.protocol,
    title: input.requestPointer.title,
  };

  if (input.audience.kind === "assignee") {
    if (input.audience.userId === input.actorUserId) return null;

    return {
      type: "pending_item_responded",
      ...eventBase,
      recipientUserIds: [input.audience.userId],
      payload: {
        type: "pending_item_responded",
        ...payloadBase,
      },
    };
  }

  if (input.audience.userIds.length === 0) return null;

  return {
    type: "pending_item_responded_unassigned",
    ...eventBase,
    recipientUserIds: [...input.audience.userIds],
    payload: {
      type: "pending_item_responded_unassigned",
      ...payloadBase,
      notice: PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
    },
  };
}
