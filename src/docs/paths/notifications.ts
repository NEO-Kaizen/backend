const json = (ref: string) => ({
  content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } },
});

const error = (description: string) => ({
  description,
  ...json("ErrorResponse"),
});

export default {
  "/notifications": {
    get: {
      tags: ["Notificações"],
      summary: "Listar notificações",
      description:
        "Lista as notificações do usuário autenticado, da mais recente para a mais antiga. Paginação por cursor opaco.",
      operationId: "listNotifications",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "cursor",
          in: "query",
          required: false,
          schema: { type: "string", maxLength: 512 },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        },
      ],
      responses: {
        "200": { description: "Página de notificações.", ...json("NotificationListResponse") },
        "400": error("Cursor ou limite inválido."),
        "401": error("Sessão ausente ou inválida."),
      },
    },
  },

  "/notifications/unread-count": {
    get: {
      tags: ["Notificações"],
      summary: "Contar notificações não lidas",
      description: "Retorna o contador de notificações não lidas do usuário autenticado.",
      operationId: "getNotificationUnreadCount",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Contador de não lidas.",
          ...json("NotificationUnreadCountResponse"),
        },
        "401": error("Sessão ausente ou inválida."),
      },
    },
  },

  "/notifications/{notificationId}/read": {
    patch: {
      tags: ["Notificações"],
      summary: "Marcar notificação como lida",
      description:
        "Idempotente: repetir a chamada devolve o instante original de leitura. Notificação de outro usuário responde 404 (sem revelar existência).",
      operationId: "markNotificationRead",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "notificationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "200": { description: "Notificação marcada.", ...json("NotificationMarkReadResponse") },
        "400": error("Identificador inválido."),
        "401": error("Sessão ausente ou inválida."),
        "404": error("Notificação não encontrada para o usuário."),
      },
    },
  },

  "/notifications/read-all": {
    patch: {
      tags: ["Notificações"],
      summary: "Marcar todas as notificações como lidas",
      description: "Marca em massa todas as notificações não lidas do usuário autenticado.",
      operationId: "markAllNotificationsRead",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Quantidade marcada.",
          ...json("NotificationMarkAllReadResponse"),
        },
        "401": error("Sessão ausente ou inválida."),
      },
    },
  },

  "/notifications/stream": {
    get: {
      tags: ["Notificações"],
      summary: "Stream SSE de notificações",
      description:
        "Server-Sent Events autenticado pelo cookie. Formato: `retry: 3000`, comentário `: connected`, eventos `event: notification` com o mesmo item da lista em `data`, `id` da notificação e `: keep-alive` a cada 25 segundos. " +
        "Ao reconectar, reenvia notificações posteriores à âncora (`Last-Event-ID` ou query `lastEventId`) em ordem cronológica; a âncora precisa pertencer ao usuário. Eventos ao vivo são enfileirados durante o replay para não se perderem entre a consulta e a assinatura; o cliente deduplica por `id`.",
      operationId: "streamNotifications",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "Last-Event-ID",
          in: "header",
          required: false,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "lastEventId",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "200": {
          description: "Stream `text/event-stream`.",
          content: {
            "text/event-stream": {
              schema: { type: "string" },
            },
          },
        },
        "401": error("Sessão ausente ou inválida."),
      },
    },
  },
};
