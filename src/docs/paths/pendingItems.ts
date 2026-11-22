export default {
  "/requests/{protocol}/pending-items": {
    get: {
      tags: ["Pendências"],
      summary: "Listar Pendências",
      description:
        "Lista as Pendências de uma solicitação via dual-auth (cookie ou header `X-Requester-Identity`). Com sessão, a porta interna exige `pending_item:read` sob Custódia; a porta do Solicitante aceita `pending_item:respond` em `own`. Sem sessão, a identidade pública continua validando protocolo + nome + e-mail. Retorna o envelope do lote vigente (`batchId`, `requestAttachment` e `items`).",
      operationId: "listPendingItems",
      security: [],
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
          description: "Envelope do lote de pendências vigente.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["batchId", "requestAttachment", "items"],
                properties: {
                  batchId: {
                    type: "string",
                    nullable: true,
                    example: "a6e8923e-7661-4827-9a6d-4898d9c70739",
                  },
                  requestAttachment: { type: "boolean", example: false },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: [
                        "id",
                        "protocol",
                        "batchId",
                        "type",
                        "field",
                        "comment",
                        "status",
                        "correctedValue",
                        "responseText",
                        "responseAttachments",
                        "createdAt",
                      ],
                      properties: {
                        id: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
                        protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
                        batchId: {
                          type: "string",
                          example: "a6e8923e-7661-4827-9a6d-4898d9c70739",
                        },
                        type: {
                          type: "string",
                          enum: ["field_edit", "observation"],
                          example: "field_edit",
                        },
                        field: {
                          type: "object",
                          nullable: true,
                          required: ["fieldKey", "fieldLabel", "currentValue"],
                          properties: {
                            fieldKey: { type: "string", example: "operational.desiredDeadline" },
                            fieldLabel: { type: "string", example: "Prazo desejado" },
                            currentValue: {
                              type: ["string", "number", "boolean", "null"],
                              example: null,
                            },
                          },
                        },
                        comment: { type: "string", example: "Ajustar prazo para próxima segunda." },
                        status: {
                          type: "string",
                          enum: ["requested", "responded", "validated"],
                          example: "requested",
                        },
                        correctedValue: {
                          type: ["string", "number", "boolean", "null"],
                          example: null,
                        },
                        responseText: { type: ["string", "null"], example: null },
                        responseAttachments: {
                          type: "array",
                          items: {
                            type: "object",
                            required: [
                              "fileName",
                              "mimeType",
                              "sizeBytes",
                              "downloadUrl",
                              "canDownload",
                            ],
                            properties: {
                              fileName: { type: "string", example: "comprovante.pdf" },
                              mimeType: { type: "string", example: "application/pdf" },
                              sizeBytes: { type: "number", example: 1024 },
                              downloadUrl: { type: ["string", "null"], example: null },
                              canDownload: { type: "boolean", example: false },
                            },
                          },
                        },
                        deadline: { type: ["string", "null"], example: null },
                        createdAt: {
                          type: "string",
                          format: "date-time",
                          example: "2026-10-15T13:30:00.000Z",
                        },
                        respondedAt: { type: ["string", "null"], example: null },
                        validatedAt: { type: ["string", "null"], example: null },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Parâmetro `protocol` inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Não autenticado ou identidade inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description:
            "Sessão sem `pending_item:read` nem `pending_item:respond` para a porta do Solicitante.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação não encontrada ou fora da Custódia/Posse do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Pendências"],
      summary: "Criar Pendências",
      description:
        "Cria Pendências para uma solicitação. Exige `pending_item:write` sob Custódia do Responsável corrente. Aceita `observation` (texto livre) e/ou `items` (edições de campo).",
      operationId: "createPendingItems",
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
                observation: {
                  type: "string",
                  maxLength: 2000,
                  example: "Verificar anexos de homologação.",
                },
                requestAttachment: { type: "boolean", example: false },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["fieldKey", "comment"],
                    properties: {
                      fieldKey: { type: "string", example: "operational.desiredDeadline" },
                      comment: {
                        type: "string",
                        maxLength: 2000,
                        example: "Ajustar prazo para próxima segunda.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Pendências criadas com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["batchId", "requestAttachment", "items"],
                properties: {
                  batchId: { type: "string", example: "a6e8923e-7661-4827-9a6d-4898d9c70739" },
                  requestAttachment: { type: "boolean", example: false },
                  items: {
                    type: "array",
                    items: { type: "object" },
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Parâmetros inválidos (protocolo ou body).",
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
          description: "Sessão sem `pending_item:write`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação não encontrada ou fora da Custódia/Posse do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "409": {
          description: "Conflito (solicitação já concluída/cancelada ou já existe lote em aberto).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}/pending-items/review": {
    patch: {
      tags: ["Pendências"],
      summary: "Revisar Pendências",
      description:
        "Revisa (valida/reabre) Pendências de um lote. Exige `pending_item:review` sob Custódia do Responsável corrente.",
      operationId: "reviewPendingItems",
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
              required: ["batchId", "items"],
              properties: {
                batchId: { type: "string", example: "a6e8923e-7661-4827-9a6d-4898d9c70739" },
                requestAttachment: { type: "boolean", example: false },
                items: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    required: ["id", "decision"],
                    discriminator: {
                      propertyName: "decision",
                      mapping: {
                        validate: "#/components/schemas/ReviewDecisionValidate",
                        reopen: "#/components/schemas/ReviewDecisionReopen",
                      },
                    },
                    properties: {
                      id: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
                      decision: {
                        type: "string",
                        enum: ["validate", "reopen"],
                        example: "validate",
                      },
                      note: { type: "string", maxLength: 2000, example: "Parece correto." },
                      comment: {
                        type: "string",
                        maxLength: 2000,
                        example: "Precisa de correção no campo X.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Pendências revisadas com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["batchId", "items"],
                properties: {
                  batchId: { type: "string", example: "a6e8923e-7661-4827-9a6d-4898d9c70739" },
                  items: {
                    type: "array",
                    items: { type: "object" },
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Parâmetros inválidos (protocolo ou body).",
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
          description: "Sessão sem `pending_item:review`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação/lote não encontrado ou fora da Custódia do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "409": {
          description: "Conflito de status do item (ex.: item não está em `responded`).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}/pending-items/{pendingItemId}": {
    patch: {
      tags: ["Pendências"],
      summary: "Responder pendência",
      description:
        "Responde a uma pendência específica. Com sessão, exige `pending_item:respond` em `own` e Posse sobre a solicitação; sem sessão, usa a identidade pública validada. Para `field_edit` envia `correctedValue`; para `observation` envia `response`.",
      operationId: "respondPendingItem",
      security: [],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
        {
          name: "pendingItemId",
          in: "path",
          required: true,
          schema: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                correctedValue: {
                  type: ["string", "number", "boolean", "null"],
                  example: "2026-11-20",
                },
                response: { type: "string", maxLength: 2000, example: "Resposta do solicitante." },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Pendência respondida com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "id",
                  "protocol",
                  "batchId",
                  "type",
                  "field",
                  "comment",
                  "status",
                  "correctedValue",
                  "responseText",
                  "responseAttachments",
                  "createdAt",
                ],
                properties: {
                  id: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
                  protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
                  batchId: { type: "string", example: "a6e8923e-7661-4827-9a6d-4898d9c70739" },
                  type: {
                    type: "string",
                    enum: ["field_edit", "observation"],
                    example: "field_edit",
                  },
                  field: {
                    type: "object",
                    nullable: true,
                    required: ["fieldKey", "fieldLabel", "currentValue"],
                    properties: {
                      fieldKey: { type: "string", example: "operational.desiredDeadline" },
                      fieldLabel: { type: "string", example: "Prazo desejado" },
                      currentValue: {
                        type: ["string", "number", "boolean", "null"],
                        example: null,
                      },
                    },
                  },
                  comment: { type: "string", example: "Ajustar prazo para próxima segunda." },
                  status: {
                    type: "string",
                    enum: ["requested", "responded", "validated"],
                    example: "responded",
                  },
                  correctedValue: { type: ["string", "number", "boolean", "null"], example: null },
                  responseText: { type: ["string", "null"], example: null },
                  responseAttachments: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["fileName", "mimeType", "sizeBytes", "downloadUrl", "canDownload"],
                      properties: {
                        fileName: { type: "string", example: "comprovante.pdf" },
                        mimeType: { type: "string", example: "application/pdf" },
                        sizeBytes: { type: "number", example: 1024 },
                        downloadUrl: { type: ["string", "null"], example: null },
                        canDownload: { type: "boolean", example: false },
                      },
                    },
                  },
                  deadline: { type: ["string", "null"], example: null },
                  createdAt: {
                    type: "string",
                    format: "date-time",
                    example: "2026-10-15T13:30:00.000Z",
                  },
                  respondedAt: { type: ["string", "null"], example: null },
                  validatedAt: { type: ["string", "null"], example: null },
                },
              },
            },
          },
        },
        "400": {
          description: "Parâmetros inválidos (protocolo, pendingItemId ou body).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Não autenticado ou identidade inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `pending_item:respond` em `own`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação/pendência não encontrada ou fora da Posse do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "409": {
          description: "Pendência já respondida ou não está em estado permitido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}/pending-items/{pendingItemId}/attachments": {
    post: {
      tags: ["Pendências"],
      summary: "Anexar arquivo à pendência",
      description:
        "Anexa um arquivo a uma pendência. Com sessão, exige `pending_item:respond` em `own` e Posse sobre a solicitação; sem sessão, usa a identidade pública validada.",
      operationId: "attachPendingItem",
      security: [],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
        {
          name: "pendingItemId",
          in: "path",
          required: true,
          schema: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file"],
              properties: {
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Anexo adicionado com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fileName", "mimeType", "sizeBytes", "downloadUrl", "canDownload"],
                properties: {
                  fileName: { type: "string", example: "comprovante.pdf" },
                  mimeType: { type: "string", example: "application/pdf" },
                  sizeBytes: { type: "number", example: 1024 },
                  downloadUrl: { type: ["string", "null"], example: null },
                  canDownload: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        "400": {
          description: "Arquivo acima de 10 MB ou formato não permitido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Não autenticado ou identidade inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `pending_item:respond` em `own`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação/pendência não encontrada ou fora da Posse do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}/public/verify": {
    post: {
      tags: ["Pendências"],
      summary: "Verificação pública de pendência",
      description:
        "Endpoint público para verificação de pendência sem autenticação (modo PUBLIC). Sujeito a rate-limit (429).",
      operationId: "publicVerify",
      security: [],
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
              required: ["name", "email"],
              properties: {
                name: { type: "string", minLength: 3, maxLength: 150, example: "Maria Oliveira" },
                email: {
                  type: "string",
                  format: "email",
                  example: "maria.oliveira@instituicao.gov.br",
                },
                protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Verificação realizada com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["protocol", "canAccess"],
                properties: {
                  protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
                  canAccess: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        "400": {
          description: "Parâmetros inválidos (protocolo ou body).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Identidade inválida ou protocolo não encontrado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Verificação indisponível no modo atual.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "429": {
          description: "Muitas tentativas. Tente novamente em alguns minutos (rate-limit).",
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
