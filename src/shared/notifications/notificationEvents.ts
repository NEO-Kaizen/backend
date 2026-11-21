import { z } from "zod";

/**
 * Catálogo de Eventos de Notificação e dos Payloads permitidos.
 *
 * O Payload é a Allowlist: a Notificação é um ponteiro para a solicitação e
 * nunca carrega mensagem técnica, scores, notas internas ou campos de triagem.
 * Cada variante nova entra aqui com schema próprio (`.strict()`), e o emissor
 * valida o Evento antes de gravar.
 */
const requestPointerFields = {
  protocol: z.string().trim().min(1).max(25),
  title: z.string().trim().min(1).max(150),
};

export const statusChangedPayloadSchema = z
  .object({
    type: z.literal("status_changed"),
    ...requestPointerFields,
    newStatus: z.string().trim().min(1).max(100),
  })
  .strict();

export const pendingItemCreatedPayloadSchema = z
  .object({
    type: z.literal("pending_item_created"),
    ...requestPointerFields,
  })
  .strict();

export const pendingItemReopenedPayloadSchema = z
  .object({
    type: z.literal("pending_item_reopened"),
    ...requestPointerFields,
  })
  .strict();

export const pendingItemValidatedPayloadSchema = z
  .object({
    type: z.literal("pending_item_validated"),
    ...requestPointerFields,
  })
  .strict();

export const notificationPayloadSchema = z.discriminatedUnion("type", [
  statusChangedPayloadSchema,
  pendingItemCreatedPayloadSchema,
  pendingItemReopenedPayloadSchema,
  pendingItemValidatedPayloadSchema,
]);

export type StatusChangedNotificationPayload = z.infer<typeof statusChangedPayloadSchema>;
export type PendingItemCreatedNotificationPayload = z.infer<typeof pendingItemCreatedPayloadSchema>;
export type PendingItemReopenedNotificationPayload = z.infer<
  typeof pendingItemReopenedPayloadSchema
>;
export type PendingItemValidatedNotificationPayload = z.infer<
  typeof pendingItemValidatedPayloadSchema
>;
export type PendingItemNotificationPayload =
  | PendingItemCreatedNotificationPayload
  | PendingItemReopenedNotificationPayload
  | PendingItemValidatedNotificationPayload;
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

export const statusChangedEventSchema = notificationEventBaseSchema
  .extend({
    type: z.literal("status_changed"),
    payload: statusChangedPayloadSchema,
  })
  .strict();

export const pendingItemCreatedEventSchema = notificationEventBaseSchema
  .extend({
    type: z.literal("pending_item_created"),
    payload: pendingItemCreatedPayloadSchema,
  })
  .strict();

export const pendingItemReopenedEventSchema = notificationEventBaseSchema
  .extend({
    type: z.literal("pending_item_reopened"),
    payload: pendingItemReopenedPayloadSchema,
  })
  .strict();

export const pendingItemValidatedEventSchema = notificationEventBaseSchema
  .extend({
    type: z.literal("pending_item_validated"),
    payload: pendingItemValidatedPayloadSchema,
  })
  .strict();

export const notificationEventSchema = z.discriminatedUnion("type", [
  statusChangedEventSchema,
  pendingItemCreatedEventSchema,
  pendingItemReopenedEventSchema,
  pendingItemValidatedEventSchema,
]);

export type StatusChangedNotificationEvent = z.infer<typeof statusChangedEventSchema>;
export type PendingItemNotificationEvent = z.infer<
  | typeof pendingItemCreatedEventSchema
  | typeof pendingItemReopenedEventSchema
  | typeof pendingItemValidatedEventSchema
>;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type NotificationEventType = NotificationEvent["type"];
