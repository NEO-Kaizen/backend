export default {
  "/notifications": {
    get: {
      tags: ["Notificações"],
      summary: "Listar Notificações",
      description:
        "Lista as Notificações do usuário autenticado, da mais recente para a mais antiga, com estado de leitura. Paginação por cursor opaco (`nextCursor`).",
      operationId: "listNotifications",
      parameters: [
        {
          name: "cursor",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        },
      ],
      responses: {
        "200": {
          description: "Página de Notificações.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationListResponse" },
            },
          },
        },
        "400": {
          description: "Cursor ou limite inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Sessão ausente ou inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/notifications/unread-count": {
    get: {
      tags: ["Notificações"],
      summary: "Contar Notificações não lidas",
      description: "Retorna o contador de Notificações não lidas do usuário autenticado.",
      operationId: "getNotificationUnreadCount",
      responses: {
        "200": {
          description: "Contador de não lidas.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationUnreadCountResponse" },
            },
          },
        },
        "401": {
          description: "Sessão ausente ou inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/notifications/{notificationId}/read": {
    patch: {
      tags: ["Notificações"],
      summary: "Marcar Notificação como lida",
      description:
        "Marca uma Notificação do usuário autenticado como lida. A operação é idempotente: repetir devolve o instante original de leitura.",
      operationId: "markNotificationRead",
      parameters: [
        {
          name: "notificationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        "200": {
          description: "Notificação marcada como lida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationMarkReadResponse" },
            },
          },
        },
        "400": {
          description: "Identificador inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Sessão ausente ou inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Notificação não encontrada para o usuário.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/notifications/read-all": {
    patch: {
      tags: ["Notificações"],
      summary: "Marcar todas as Notificações como lidas",
      description: "Marca em massa todas as Notificações não lidas do usuário autenticado.",
      operationId: "markAllNotificationsRead",
      responses: {
        "200": {
          description: "Quantidade de Notificações marcadas.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationMarkAllReadResponse" },
            },
          },
        },
        "401": {
          description: "Sessão ausente ou inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/notifications/stream": {
    get: {
      tags: ["Notificações"],
      summary: "Stream SSE de Notificações",
      description:
        "Entrega as Notificações em tempo real via Server-Sent Events, autenticado pelo cookie de sessão. O evento `notification` traz o mesmo item da lista no `data` e o id da Notificação no campo `id`. Ao reconectar com `Last-Event-ID`, reenvia as Notificações criadas depois da âncora; o cliente deduplica por id.",
      operationId: "streamNotifications",
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
        "401": {
          description: "Sessão ausente ou inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
};
