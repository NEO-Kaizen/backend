import { z } from "zod";

/**
 * Catálogo de Eventos de Notificação e dos Payloads permitidos.
 *
 * O Payload é a Allowlist: a Notificação é um ponteiro para a solicitação e
 * nunca carrega mensagem técnica, scores, notas internas ou campos de triagem.
 * Cada variante nova entra aqui com schema próprio (`.strict()`), e o emissor
 * valida o Evento antes de gravar.
 */
/** Aviso explícito da solicitação sem Responsável designado. */
export const PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE = "Sem responsável designado";

/** Campos comuns dos Payloads que apontam para uma solicitação. */
const requestPointerPayloadSchema = z.object({
  protocol: z.string().trim().min(1).max(25),
  title: z.string().trim().min(1).max(150),
});

export type RequestPointer = z.infer<typeof requestPointerPayloadSchema>;

/** Fábrica dos Payloads de Pendência: cada variante continua `.strict()`. */
function pendingItemPayloadSchema<T extends string>(type: T) {
  return requestPointerPayloadSchema
    .extend({
      type: z.literal(type),
    })
    .strict();
}

export const statusChangedPayloadSchema = requestPointerPayloadSchema
  .extend({
    type: z.literal("status_changed"),
    newStatus: z.string().trim().min(1).max(100),
  })
  .strict();

export const pendingItemCreatedPayloadSchema = pendingItemPayloadSchema("pending_item_created");

export const pendingItemReopenedPayloadSchema = pendingItemPayloadSchema("pending_item_reopened");

export const pendingItemValidatedPayloadSchema = pendingItemPayloadSchema("pending_item_validated");

export const pendingItemRespondedPayloadSchema = pendingItemPayloadSchema("pending_item_responded");

export const pendingItemRespondedUnassignedPayloadSchema = requestPointerPayloadSchema
  .extend({
    type: z.literal("pending_item_responded_unassigned"),
    notice: z.literal(PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE),
  })
  .strict();

export const notificationPayloadSchema = z.discriminatedUnion("type", [
  statusChangedPayloadSchema,
  pendingItemCreatedPayloadSchema,
  pendingItemReopenedPayloadSchema,
  pendingItemValidatedPayloadSchema,
  pendingItemRespondedPayloadSchema,
  pendingItemRespondedUnassignedPayloadSchema,
]);

export type StatusChangedNotificationPayload = z.infer<typeof statusChangedPayloadSchema>;
export type PendingItemRespondedNotificationPayload = z.infer<
  typeof pendingItemRespondedPayloadSchema
>;
export type PendingItemRespondedUnassignedNotificationPayload = z.infer<
  typeof pendingItemRespondedUnassignedPayloadSchema
>;
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

/** Campos comuns dos Eventos de Notificação, validados na emissão. */
const notificationEventBaseSchema = z
  .object({
    /**
     * Chave do evento de negócio (ex.: id da auditoria). Junto do destinatário
     * forma a `dedup_key`, garantindo uma Notificação por destinatário.
     */
    eventKey: z.string().trim().min(1).max(120),
    requestId: z.string().trim().min(1).max(32),
    actorUserId: z.number().int().positive(),
    recipientUserIds: z.array(z.number().int().positive()).min(1),
  })
  .strict();

/** Campos comuns dos Eventos de Notificação, inferidos do schema de validação. */
export type NotificationEventBase = z.infer<typeof notificationEventBaseSchema>;

/**
 * Base dos Eventos de resposta de Pendência. O ator pode ser ausente (`null`)
 * quando a resposta vem da identidade pública sem conta de usuário vinculada.
 */
const pendingItemResponseEventBaseSchema = notificationEventBaseSchema
  .extend({
    actorUserId: z.number().int().positive().nullable(),
  })
  .strict();

/** Fábrica dos Eventos: mantém `type` e `payload` correlacionados e `.strict()`. */
function notificationEventSchemaFor<T extends string, P extends z.ZodType>(type: T, payload: P) {
  return notificationEventBaseSchema
    .extend({
      type: z.literal(type),
      payload,
    })
    .strict();
}

export const statusChangedEventSchema = notificationEventSchemaFor(
  "status_changed",
  statusChangedPayloadSchema,
);

export const pendingItemCreatedEventSchema = notificationEventSchemaFor(
  "pending_item_created",
  pendingItemCreatedPayloadSchema,
);

export const pendingItemReopenedEventSchema = notificationEventSchemaFor(
  "pending_item_reopened",
  pendingItemReopenedPayloadSchema,
);

export const pendingItemValidatedEventSchema = notificationEventSchemaFor(
  "pending_item_validated",
  pendingItemValidatedPayloadSchema,
);

export const pendingItemRespondedEventSchema = pendingItemResponseEventBaseSchema
  .extend({
    type: z.literal("pending_item_responded"),
    payload: pendingItemRespondedPayloadSchema,
  })
  .strict();

export const pendingItemRespondedUnassignedEventSchema = pendingItemResponseEventBaseSchema
  .extend({
    type: z.literal("pending_item_responded_unassigned"),
    payload: pendingItemRespondedUnassignedPayloadSchema,
  })
  .strict();

export const notificationEventSchema = z.discriminatedUnion("type", [
  statusChangedEventSchema,
  pendingItemCreatedEventSchema,
  pendingItemReopenedEventSchema,
  pendingItemValidatedEventSchema,
  pendingItemRespondedEventSchema,
  pendingItemRespondedUnassignedEventSchema,
]);

export type StatusChangedNotificationEvent = z.infer<typeof statusChangedEventSchema>;
export type PendingItemRespondedNotificationEvent = z.infer<typeof pendingItemRespondedEventSchema>;
export type PendingItemRespondedUnassignedNotificationEvent = z.infer<
  typeof pendingItemRespondedUnassignedEventSchema
>;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type NotificationEventType = NotificationEvent["type"];

/** Fonte única dos Eventos de criação, reabertura e validação, usada por OpenAPI e scripts. */
export const PENDING_ITEM_EVENT_TYPES = [
  "pending_item_created",
  "pending_item_reopened",
  "pending_item_validated",
] as const satisfies readonly NotificationEventType[];

export type PendingItemEventType = (typeof PENDING_ITEM_EVENT_TYPES)[number];
export type PendingItemNotificationEvent = Extract<
  NotificationEvent,
  { type: PendingItemEventType }
>;

/** Fonte única dos Eventos de resposta de Pendência, usada pelo OpenAPI. */
export const PENDING_ITEM_RESPONSE_EVENT_TYPES = [
  "pending_item_responded",
  "pending_item_responded_unassigned",
] as const satisfies readonly NotificationEventType[];

/** Fonte única dos tipos para o OpenAPI; `satisfies` mantém a união em sincronia. */
export const NOTIFICATION_EVENT_TYPES = [
  "status_changed",
  ...PENDING_ITEM_EVENT_TYPES,
  ...PENDING_ITEM_RESPONSE_EVENT_TYPES,
] as const satisfies readonly NotificationEventType[];
