import { z } from "zod";

/**
 * Catálogo de Eventos de Notificação e dos Payloads permitidos.
 *
 * O Payload é a Allowlist: a Notificação é um ponteiro para a solicitação e
 * nunca carrega mensagem técnica, scores, notas internas ou campos de triagem.
 * Cada variante nova entra aqui com schema próprio (`.strict()`), e o emissor
 * valida o Evento antes de gravar.
 */
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

export const notificationPayloadSchema = z.discriminatedUnion("type", [
  statusChangedPayloadSchema,
  pendingItemCreatedPayloadSchema,
  pendingItemReopenedPayloadSchema,
  pendingItemValidatedPayloadSchema,
]);

export type StatusChangedNotificationPayload = z.infer<typeof statusChangedPayloadSchema>;
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

export const notificationEventSchema = z.discriminatedUnion("type", [
  statusChangedEventSchema,
  pendingItemCreatedEventSchema,
  pendingItemReopenedEventSchema,
  pendingItemValidatedEventSchema,
]);

export type StatusChangedNotificationEvent = z.infer<typeof statusChangedEventSchema>;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type NotificationEventType = NotificationEvent["type"];

/** Fonte única dos tipos para o OpenAPI; `satisfies` mantém a união em sincronia. */
export const NOTIFICATION_EVENT_TYPES = [
  "status_changed",
  "pending_item_created",
  "pending_item_reopened",
  "pending_item_validated",
] as const satisfies readonly NotificationEventType[];
