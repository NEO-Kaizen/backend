export default {
  "/queue/metrics": {
    get: {
      tags: ["Fila de atendimento"],
      summary: "Métricas da fila",
      description:
        "Retorna Métricas consolidadas da fila de atendimento. Exige autenticação e perfil interno (Analista, Gestor ou Administrador).",
      operationId: "getQueueMetrics",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Métricas da fila.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/QueueMetrics" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Analista, Gestor, Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/queue": {
    get: {
      tags: ["Fila de atendimento"],
      summary: "Listar fila de atendimento",
      description:
        "Centraliza a listagem da fila com Páginação, busca e filtros. Exige autenticação e perfil interno.",
      operationId: "getQueue",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          required: true,
          description: "Número da página (>= 1).",
          schema: { type: "integer", minimum: 1, example: 1 },
        },
        {
          name: "pageSize",
          in: "query",
          required: true,
          description: "Itens por página (1 a 100).",
          schema: { type: "integer", minimum: 1, maximum: 100, example: 10 },
        },
        {
          name: "search",
          in: "query",
          required: false,
          description: "Busca por protocolo, e-mail corporativo ou nome do solicitante.",
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
        {
          name: "status",
          in: "query",
          required: false,
          description: "Valor exato de um status válido.",
          schema: { type: "string", example: "Em triagem" },
        },
        {
          name: "priority",
          in: "query",
          required: false,
          description: "Valor exato de prioridade.",
          schema: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"], example: "Alta" },
        },
        {
          name: "assigneeId",
          in: "query",
          required: false,
          description: "UUID do profissional ou `unassigned`.",
          schema: { type: "string", example: "unassigned" },
        },
        {
          name: "unassigned",
          in: "query",
          required: false,
          description: "true/1 para listar apenas solicitações sem responsável.",
          schema: { type: "string", enum: ["true", "1", "false", "0"], example: "true" },
        },
      ],
      responses: {
        "200": {
          description: "página de solicitações da fila.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/QueueResponse" },
            },
          },
        },
        "400": {
          description: "Parâmetros `page` ou `pageSize` ausentes ou inválidos.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Analista, Gestor, Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/queue/requests/:protocol/mapping": {
    get: {
      tags: ["Fila de atendimento"],
      summary: "Consultar mapeamento da solicitação",
      description:
        "Consulta o mapeamento mais recente de uma solicitação (agendamento). " +
        "Exige autenticação e perfil interno (Analista, Gestor ou Administrador).",
      operationId: "getMapping",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      responses: {
        "200": {
          description: "Mapeamento (ou estado vazio se não houver).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MappingResponse" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Fila de atendimento"],
      summary: "Criar ou atualizar mapeamento",
      description:
        "Cria ou atualiza o mapeamento da solicitação. Campos ausentes mantem o valor atual; `null` limpa; `participants` substitui a lista.",
      operationId: "putMapping",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                scheduledFor: { type: "string", format: "date-time", nullable: true },
                durationMinutes: { type: "integer", minimum: 15, maximum: 480, nullable: true },
                modality: { type: "string", enum: ["REMOTE", "IN_PERSON"], nullable: true },
                meetingLink: { type: "string", nullable: true },
                location: { type: "string", nullable: true },
                participants: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", nullable: true },
                      name: { type: "string" },
                      email: { type: "string", format: "email" },
                    },
                  },
                },
                notes: { type: "string", nullable: true },
                mappingAssigneeId: { type: "string", nullable: true },
                completeMapping: { type: "boolean", nullable: true },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Mapeamento atualizado com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MappingResponse" },
            },
          },
        },
        "400": {
          description: "Payload malformado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sem permissão para editar o mapeamento.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo ou mapeamento inexistente.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "422": {
          description: "Erro de validação de campos ou estado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
      },
    },
  },
};
