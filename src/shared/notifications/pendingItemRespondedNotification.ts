import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import {
  PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
  type NotificationEvent,
  type PendingItemRespondedNotificationPayload,
} from "./notificationEvents.ts";

const EVENT_KEY_PREFIX = "request.pending_responded";

/** Audiência resolvida: Responsável designado ou Administradores ativos. */
export type PendingItemRespondedAudience =
  { assigneeUserId: number } | { activeAdminUserIds: readonly number[] };

export interface PendingItemRespondedNotificationInput extends Omit<
  PendingItemRespondedNotificationPayload,
  "type"
> {
  /** `audit_id` da resposta; junto do prefixo forma a `eventKey`. */
  auditId: string;
  requestId: string;
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
 * O ator e destinatários duplicados são removidos pelo emissor; o payload é
 * um ponteiro com os campos da Allowlist.
 */
export async function emitPendingItemRespondedNotification(
  trx: Knex.Transaction,
  input: PendingItemRespondedNotificationInput,
): Promise<CommittedNotification[]> {
  const eventBase = {
    eventKey: `${EVENT_KEY_PREFIX}:${input.auditId}`,
    requestId: input.requestId,
    actorUserId: input.actorUserId,
  };

  if ("activeAdminUserIds" in input.audience && input.audience.activeAdminUserIds.length === 0) {
    return [];
  }

  const event: NotificationEvent =
    "assigneeUserId" in input.audience
      ? {
          type: "pending_item_responded",
          ...eventBase,
          recipientUserIds: [input.audience.assigneeUserId],
          payload: {
            type: "pending_item_responded",
            protocol: input.protocol,
            title: input.title,
          },
        }
      : {
          type: "pending_item_responded_unassigned",
          ...eventBase,
          recipientUserIds: [...input.audience.activeAdminUserIds],
          payload: {
            type: "pending_item_responded_unassigned",
            protocol: input.protocol,
            title: input.title,
            notice: PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
          },
        };

  return emitNotification(trx, event);
}
