import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import {
  PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
  type NotificationEvent,
  type PendingItemRespondedNotificationEvent,
  type PendingItemRespondedUnassignedNotificationEvent,
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
  /** Resolvida pelo chamador antes da emissão, já sem o ator. */
  audience: PendingItemRespondedAudience;
}

type PendingItemRespondedEvent =
  PendingItemRespondedNotificationEvent | PendingItemRespondedUnassignedNotificationEvent;

interface NotificationEventBase {
  eventKey: string;
  requestId: string;
  actorUserId: number | null;
}

function buildAssigneeEvent(
  audience: Extract<PendingItemRespondedAudience, { kind: "assignee" }>,
  eventBase: NotificationEventBase,
  requestPointer: RequestPointer,
): PendingItemRespondedEvent | null {
  // Autoexclusão tem precedência sobre o critério de contagem.
  if (audience.userId === eventBase.actorUserId) return null;

  return {
    type: "pending_item_responded",
    ...eventBase,
    recipientUserIds: [audience.userId],
    payload: {
      type: "pending_item_responded",
      ...requestPointer,
    },
  };
}

function buildUnassignedEvent(
  audience: Extract<PendingItemRespondedAudience, { kind: "active_admins" }>,
  eventBase: NotificationEventBase,
  requestPointer: RequestPointer,
): PendingItemRespondedEvent | null {
  const recipientUserIds = [...new Set(audience.userIds)];
  if (recipientUserIds.length === 0) return null;

  return {
    type: "pending_item_responded_unassigned",
    ...eventBase,
    recipientUserIds,
    payload: {
      type: "pending_item_responded_unassigned",
      ...requestPointer,
      notice: PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
    },
  };
}

/**
 * Emite o Evento "Pendência respondida" na matriz de audiência do RF20.
 *
 * - Com Responsável designado: notifica o Responsável pela solicitação.
 * - Sem Responsável: notifica os Administradores ativos, com o aviso
 *   explícito de que a solicitação está sem responsável.
 *
 * A autoexclusão do ator tem precedência: quando o Responsável é quem
 * responde, o Evento não é emitido. A audiência de Administradores chega sem
 * o ator; uma lista vazia também não gera Evento. O payload é um ponteiro com
 * os campos da Allowlist.
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
  const eventBase: NotificationEventBase = {
    eventKey: `${EVENT_KEY_PREFIX}:${input.auditId}`,
    requestId: input.requestId,
    actorUserId: input.actorUserId,
  };

  switch (input.audience.kind) {
    case "assignee":
      return buildAssigneeEvent(input.audience, eventBase, input.requestPointer);
    case "active_admins":
      return buildUnassignedEvent(input.audience, eventBase, input.requestPointer);
  }
}
