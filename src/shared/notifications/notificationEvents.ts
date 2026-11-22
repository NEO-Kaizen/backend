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

export const pendingItemCreatedPayloadSchema = pendingItemPayloadSchema("pending_item_created");
export const pendingItemReopenedPayloadSchema = pendingItemPayloadSchema("pending_item_reopened");
export const pendingItemValidatedPayloadSchema = pendingItemPayloadSchema("pending_item_validated");

export const statusChangedPayloadSchema = requestPointerPayloadSchema
  .extend({
    type: z.literal("status_changed"),
    newStatus: z.string().trim().min(1).max(100),
  })
  .strict();

/** Agendamento do Mapeamento (issue #160): conclusão com data/hora do Agendamento. */
export const mappingScheduledPayloadSchema = requestPointerPayloadSchema
  .extend({
    type: z.literal("mapping_scheduled"),
    scheduledAt: z.iso.datetime({ offset: true }),
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

export const responsibleAssignedPayloadSchema = requestPointerPayloadSchema
  .extend({
    type: z.literal("responsible_assigned"),
    /** Categoria da solicitação no momento da designação. */
    category: z.string().trim().min(1).max(100),
    /** Status atual da solicitação no momento da designação. */
    status: z.string().trim().min(1).max(100),
  })
  .strict();

export const notificationPayloadSchema = z.discriminatedUnion("type", [
  statusChangedPayloadSchema,
  mappingScheduledPayloadSchema,
  responsibleAssignedPayloadSchema,
  pendingItemCreatedPayloadSchema,
  pendingItemReopenedPayloadSchema,
  pendingItemValidatedPayloadSchema,
  pendingItemRespondedPayloadSchema,
  pendingItemRespondedUnassignedPayloadSchema,
]);

export type StatusChangedNotificationPayload = z.infer<typeof statusChangedPayloadSchema>;
export type MappingScheduledNotificationPayload = z.infer<typeof mappingScheduledPayloadSchema>;
export type PendingItemRespondedNotificationPayload = z.infer<
  typeof pendingItemRespondedPayloadSchema
>;
export type PendingItemRespondedUnassignedNotificationPayload = z.infer<
  typeof pendingItemRespondedUnassignedPayloadSchema
>;
export type ResponsibleAssignedNotificationPayload = z.infer<
  typeof responsibleAssignedPayloadSchema
>;
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

/**
 * Chave do evento de negócio (ex.: id da auditoria). Junto do destinatário
 * forma a `dedup_key`, garantindo uma Notificação por destinatário.
 */
const notificationEventFields = {
  eventKey: z.string().trim().min(1).max(120),
  requestId: z.string().trim().min(1).max(32),
  actorUserId: z.number().int().positive(),
  recipientUserIds: z.array(z.number().int().positive()).min(1),
} as const;

/** Campos comuns dos Eventos de Notificação, validados na emissão. */
const notificationEventBaseSchema = z
  .object({
    /**
     * Chave do evento de negócio (ex.: id da auditoria). Junto do destinatário
     * forma a `dedup_key`, garantindo uma Notificação por destinatário.
     */
    ...notificationEventFields,
  })
  .strict();

/** Campos comuns dos Eventos de Notificação, inferidos do schema de validação. */
export type NotificationEventBase = z.infer<typeof notificationEventBaseSchema>;

/** Fábrica dos Eventos: mantém `type` e `payload` correlacionados e `.strict()`. */
function notificationEventSchemaFor<T extends string, P extends z.ZodType>(type: T, payload: P) {
  return notificationEventBaseSchema
    .extend({
      type: z.literal(type),
      payload,
    })
    .strict();
}

export const statusChangedEventSchema = z
  .object({
    type: z.literal("status_changed"),
    ...notificationEventFields,
    payload: statusChangedPayloadSchema,
  })
  .strict();

export const mappingScheduledEventSchema = notificationEventSchemaFor(
  "mapping_scheduled",
  mappingScheduledPayloadSchema,
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

export const responsibleAssignedEventSchema = z
  .object({
    type: z.literal("responsible_assigned"),
    eventKey: z.string().trim().min(1).max(120),
    requestId: z.string().trim().min(1).max(32),
    actorUserId: z.number().int().positive(),
    recipientUserIds: z.array(z.number().int().positive()).min(1),
    payload: responsibleAssignedPayloadSchema,
  })
  .strict();

export const notificationEventSchema = z.discriminatedUnion("type", [
  statusChangedEventSchema,
  mappingScheduledEventSchema,
  responsibleAssignedEventSchema,
  pendingItemCreatedEventSchema,
  pendingItemReopenedEventSchema,
  pendingItemValidatedEventSchema,
  pendingItemRespondedEventSchema,
  pendingItemRespondedUnassignedEventSchema,
]);

export type StatusChangedNotificationEvent = z.infer<typeof statusChangedEventSchema>;
export type MappingScheduledNotificationEvent = z.infer<typeof mappingScheduledEventSchema>;
export type PendingItemRespondedNotificationEvent = z.infer<typeof pendingItemRespondedEventSchema>;
export type PendingItemRespondedUnassignedNotificationEvent = z.infer<
  typeof pendingItemRespondedUnassignedEventSchema
>;
export type ResponsibleAssignedNotificationEvent = z.infer<typeof responsibleAssignedEventSchema>;
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

/** Fonte única dos tipos para o OpenAPI, `satisfies` mantém a união em sincronia. */
export const NOTIFICATION_EVENT_TYPES = [
  "status_changed",
  "mapping_scheduled",
  "responsible_assigned",
  ...PENDING_ITEM_EVENT_TYPES,
] as const satisfies readonly NotificationEventType[];
