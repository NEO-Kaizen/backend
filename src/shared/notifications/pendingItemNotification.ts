import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import type {
  NotificationEventBase,
  PendingItemNotificationEvent,
  RequestPointer,
} from "./notificationEvents.ts";

/** Ação do ciclo de Pendência: mesma nomenclatura da auditoria e da revisão. */
export type PendingItemNotificationAction = "create" | "reopen" | "validate";

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

interface PendingItemEventBuilder {
  readonly eventKeyPrefix: string;
  readonly build: (
    eventBase: NotificationEventBase,
    requestPointer: RequestPointer,
  ) => PendingItemNotificationEvent;
}

/**
 * Mapa `ação → Evento`: uma única fonte para o prefixo da `eventKey` e para a
 * variante do Payload. O `build` fixa `type` e `payload.type` na mesma variante,
 * sem asserção de tipo.
 */
const PENDING_ITEM_EVENT_BY_ACTION = {
  create: {
    eventKeyPrefix: "pending_item.create",
    build: (eventBase, requestPointer) => ({
      ...eventBase,
      type: "pending_item_created",
      payload: { type: "pending_item_created", ...requestPointer },
    }),
  },
  reopen: {
    eventKeyPrefix: "pending_item.reopen",
    build: (eventBase, requestPointer) => ({
      ...eventBase,
      type: "pending_item_reopened",
      payload: { type: "pending_item_reopened", ...requestPointer },
    }),
  },
  validate: {
    eventKeyPrefix: "pending_item.validate",
    build: (eventBase, requestPointer) => ({
      ...eventBase,
      type: "pending_item_validated",
      payload: { type: "pending_item_validated", ...requestPointer },
    }),
  },
} as const satisfies Record<PendingItemNotificationAction, PendingItemEventBuilder>;

async function emitPendingItemNotification(
  trx: Knex.Transaction,
  input: PendingItemNotificationsInput,
  eventInput: PendingItemNotificationEventInput,
): Promise<CommittedNotification[]> {
  const { request, actorUserId } = input;
  if (request.requesterUserId === null) return [];

  const eventBuilder = PENDING_ITEM_EVENT_BY_ACTION[eventInput.action];
  return emitNotification(
    trx,
    eventBuilder.build(
      {
        eventKey: `${eventBuilder.eventKeyPrefix}:${eventInput.auditId}`,
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
  for (const eventInput of input.events) {
    committed.push(...(await emitPendingItemNotification(trx, input, eventInput)));
  }
  return committed;
}
