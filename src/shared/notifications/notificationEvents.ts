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

export const statusChangedPayloadSchema = requestPointerPayloadSchema
  .extend({
    type: z.literal("status_changed"),
    newStatus: z.string().trim().min(1).max(100),
  })
  .strict();

export const pendingItemRespondedPayloadSchema = requestPointerPayloadSchema
  .extend({
    type: z.literal("pending_item_responded"),
  })
  .strict();

export const pendingItemRespondedUnassignedPayloadSchema = requestPointerPayloadSchema
  .extend({
    type: z.literal("pending_item_responded_unassigned"),
    notice: z.literal(PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE),
  })
  .strict();

export const notificationPayloadSchema = z.discriminatedUnion("type", [
  statusChangedPayloadSchema,
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

export const statusChangedEventSchema = z
  .object({
    type: z.literal("status_changed"),
    /**
     * Chave do evento de negócio (ex.: id da auditoria). Junto do destinatário
     * forma a `dedup_key`, garantindo uma Notificação por destinatário.
     */
    eventKey: z.string().trim().min(1).max(120),
    requestId: z.string().trim().min(1).max(32),
    actorUserId: z.number().int().positive(),
    recipientUserIds: z.array(z.number().int().positive()).min(1),
    payload: statusChangedPayloadSchema,
  })
  .strict();

/**
 * Base dos Eventos de Pendência. O ator pode ser ausente (`null`) quando a
 * resposta vem da identidade pública sem conta de usuário vinculada.
 */
const pendingItemEventBaseSchema = z.object({
  eventKey: z.string().trim().min(1).max(120),
  requestId: z.string().trim().min(1).max(32),
  actorUserId: z.number().int().positive().nullable(),
  recipientUserIds: z.array(z.number().int().positive()).min(1),
});

export const pendingItemRespondedEventSchema = pendingItemEventBaseSchema
  .extend({
    type: z.literal("pending_item_responded"),
    payload: pendingItemRespondedPayloadSchema,
  })
  .strict();

export const pendingItemRespondedUnassignedEventSchema = pendingItemEventBaseSchema
  .extend({
    type: z.literal("pending_item_responded_unassigned"),
    payload: pendingItemRespondedUnassignedPayloadSchema,
  })
  .strict();

export const notificationEventSchema = z.discriminatedUnion("type", [
  statusChangedEventSchema,
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
