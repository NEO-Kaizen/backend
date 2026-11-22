import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import type { NotificationEvent, RequestPointer } from "./notificationEvents.ts";

/** Ação do ciclo de Pendência: mesma nomenclatura da auditoria e da revisão. */
export type PendingItemNotificationAction = "create" | "reopen" | "validate";

type PendingItemEventType = Extract<NotificationEvent["type"], `pending_item_${string}`>;

/** Campos comuns dos Eventos emitidos nesta transação. */
interface NotificationEventBase {
  readonly eventKey: string;
  readonly requestId: string;
  readonly actorUserId: number;
  readonly recipientUserIds: number[];
}

/** Contexto da Solicitação relido dentro da transação. */
export interface PendingItemNotificationRequest {
  readonly requestId: string;
  readonly requesterUserId: number | null;
  readonly pointer: RequestPointer;
}

/** Primeira transição de cada ação na chamada. */
export interface PendingItemNotificationEventInput {
  readonly action: PendingItemNotificationAction;
  readonly auditId: string;
}

export interface PendingItemNotificationsInput {
  readonly request: PendingItemNotificationRequest;
  readonly actorUserId: number;
  readonly events: readonly PendingItemNotificationEventInput[];
}

/**
 * Mapa `ação → Evento`: uma única fonte para o prefixo da `eventKey` e para a
 * variante do Payload. O tipo do Evento fica restrito aos Eventos de Pendência.
 */
const PENDING_ITEM_EVENT_BY_ACTION = {
  create: { eventKeyPrefix: "pending_item.create", type: "pending_item_created" },
  reopen: { eventKeyPrefix: "pending_item.reopen", type: "pending_item_reopened" },
  validate: { eventKeyPrefix: "pending_item.validate", type: "pending_item_validated" },
} as const satisfies Record<
  PendingItemNotificationAction,
  { eventKeyPrefix: string; type: PendingItemEventType }
>;

/**
 * Constrói o Evento a partir do mapa. A asserção é segura porque `type` e
 * `payload.type` vêm da mesma entrada; o emissor ainda valida com Zod antes
 * do INSERT.
 */
function buildPendingItemEvent(
  action: PendingItemNotificationAction,
  base: NotificationEventBase,
  pointer: RequestPointer,
): NotificationEvent {
  const event = PENDING_ITEM_EVENT_BY_ACTION[action];
  return {
    ...base,
    type: event.type,
    payload: { type: event.type, ...pointer },
  } as NotificationEvent;
}

async function emitPendingItemNotification(
  trx: Knex.Transaction,
  action: PendingItemNotificationAction,
  auditId: string,
  request: PendingItemNotificationRequest,
  actorUserId: number,
): Promise<CommittedNotification[]> {
  if (request.requesterUserId === null) return [];

  const event = PENDING_ITEM_EVENT_BY_ACTION[action];
  return emitNotification(
    trx,
    buildPendingItemEvent(
      action,
      {
        eventKey: `${event.eventKeyPrefix}:${auditId}`,
        requestId: request.requestId,
        actorUserId,
        recipientUserIds: [request.requesterUserId],
      },
      request.pointer,
    ),
  );
}

/**
 * Emite os Eventos do ciclo de Pendência para o solicitante autenticado.
 *
 * A granularidade é a ação, não o item: uma criação notifica uma vez por lote
 * e uma revisão notifica uma vez por tipo de decisão (`reopen`/`validate`),
 * mesmo que a chamada decida vários itens. O emissor remove o ator da
 * audiência e solicitante anônimo não tem canal in-app na v1.
 */
export async function emitPendingItemNotifications(
  trx: Knex.Transaction,
  input: PendingItemNotificationsInput,
): Promise<CommittedNotification[]> {
  const committed: CommittedNotification[] = [];
  for (const event of input.events) {
    committed.push(
      ...(await emitPendingItemNotification(
        trx,
        event.action,
        event.auditId,
        input.request,
        input.actorUserId,
      )),
    );
  }
  return committed;
}
