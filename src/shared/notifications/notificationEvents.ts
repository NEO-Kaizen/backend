import { z } from "zod";

/**
 * Catálogo de Eventos de Notificação e dos Payloads permitidos.
 *
 * O Payload é a Allowlist: a Notificação é um ponteiro para a solicitação e
 * nunca carrega mensagem técnica, scores, notas internas ou campos de triagem.
 * Cada variante nova entra aqui com schema próprio (`.strict()`), e o emissor
 * valida o Evento antes de gravar.
 */
export const statusChangedPayloadSchema = z
  .object({
    type: z.literal("status_changed"),
    protocol: z.string().trim().min(1).max(25),
    title: z.string().trim().min(1).max(150),
    newStatus: z.string().trim().min(1).max(100),
  })
  .strict();

export const notificationPayloadSchema = statusChangedPayloadSchema;

export type StatusChangedNotificationPayload = z.infer<typeof statusChangedPayloadSchema>;
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

export const notificationEventSchema = z.discriminatedUnion("type", [statusChangedEventSchema]);

export type StatusChangedNotificationEvent = z.infer<typeof statusChangedEventSchema>;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type NotificationEventType = NotificationEvent["type"];
