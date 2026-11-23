export const PendingFieldRef = {
  type: "object",
  required: ["fieldKey", "fieldLabel", "currentValue"],
  properties: {
    fieldKey: {
      type: "string",
      description: "Caminho pontuado do catálogo de campos marcáveis.",
      example: "operational.desiredDeadline",
    },
    fieldLabel: { type: "string", description: "Derivado no servidor.", example: "Prazo desejado" },
    currentValue: {
      oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { enum: [null] }],
      description: "Snapshot do valor na criação do item.",
      example: "2026-12-31",
    },
  },
};

export const PendingAttachment = {
  type: "object",
  required: ["fileName", "mimeType", "sizeBytes", "downloadUrl", "canDownload"],
  properties: {
    fileName: { type: "string", example: "comprovante.pdf" },
    mimeType: { type: "string", example: "application/pdf" },
    sizeBytes: { type: "integer", example: 1024 },
    downloadUrl: { type: "string", nullable: true },
    canDownload: { type: "boolean", example: false },
  },
};

export const PendingItem = {
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
    "respondedAt",
    "validatedAt",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    batchId: { type: "string", format: "uuid", description: "Agrupa os itens do mesmo POST." },
    type: { type: "string", enum: ["field_edit", "observation"] },
    field: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/PendingFieldRef" }],
      nullable: true,
      description: "`null` quando `type = observation`.",
    },
    comment: {
      type: "string",
      maxLength: 2000,
      description: "Observação/justificativa do analista.",
    },
    status: { type: "string", enum: ["requested", "responded", "validated"] },
    correctedValue: {
      oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { enum: [null] }],
      description: "Resposta do campo em `field_edit`.",
    },
    responseText: {
      type: "string",
      nullable: true,
      description: "Resposta discursiva em `observation`.",
    },
    responseAttachments: {
      type: "array",
      items: { $ref: "#/components/schemas/PendingAttachment" },
    },
    deadline: {
      type: "string",
      format: "date",
      nullable: true,
      description: "Reservado; os writes atuais não preenchem (sempre `null`).",
    },
    createdAt: { type: "string", format: "date-time" },
    respondedAt: { type: "string", format: "date-time", nullable: true },
    validatedAt: { type: "string", format: "date-time", nullable: true },
  },
};

export const ListPendingItemsResponse = {
  type: "object",
  required: ["batchId", "requestAttachment", "items"],
  properties: {
    batchId: { type: "string", format: "uuid", nullable: true },
    requestAttachment: {
      type: "boolean",
      description: "Flag do LOTE: exige ao menos um anexo entre os itens do lote.",
    },
    items: { type: "array", items: { $ref: "#/components/schemas/PendingItem" } },
  },
};

export const CreatePendingItemsBody = {
  type: "object",
  description: "Pelo menos um de `observation` (1..2000 após trim) ou `items` (≥ 1) é obrigatório.",
  properties: {
    observation: {
      type: "string",
      minLength: 1,
      maxLength: 2000,
      description: "Gera 1 item `observation` com `comment = observation`.",
    },
    requestAttachment: {
      type: "boolean",
      default: false,
      description: "Flag do lote (nunca por campo).",
    },
    items: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["fieldKey", "comment"],
        properties: {
          fieldKey: { type: "string", example: "operational.desiredDeadline" },
          comment: { type: "string", minLength: 1, maxLength: 2000 },
        },
      },
    },
  },
};

export const CreatePendingItemsResponse = {
  type: "object",
  required: ["batchId", "requestAttachment", "items"],
  properties: {
    batchId: { type: "string", format: "uuid" },
    requestAttachment: { type: "boolean" },
    items: { type: "array", items: { $ref: "#/components/schemas/PendingItem" } },
  },
};

export const ReviewPendingItemsBody = {
  type: "object",
  required: ["batchId", "items"],
  properties: {
    batchId: { type: "string", format: "uuid" },
    requestAttachment: { type: "boolean" },
    items: {
      type: "array",
      minItems: 1,
      items: {
        oneOf: [
          { $ref: "#/components/schemas/ReviewDecisionValidate" },
          { $ref: "#/components/schemas/ReviewDecisionReopen" },
        ],
        discriminator: {
          propertyName: "decision",
          mapping: {
            validate: "#/components/schemas/ReviewDecisionValidate",
            reopen: "#/components/schemas/ReviewDecisionReopen",
          },
        },
      },
    },
  },
};

export const ReviewDecisionValidate = {
  type: "object",
  required: ["id", "decision"],
  properties: {
    id: { type: "string", format: "uuid", example: "00000000-0000-4000-8000-000000000099" },
    decision: { type: "string", enum: ["validate"], example: "validate" },
    note: { type: "string", maxLength: 2000, example: "Parece correto." },
  },
};

export const ReviewDecisionReopen = {
  type: "object",
  required: ["id", "decision", "comment"],
  properties: {
    id: { type: "string", format: "uuid", example: "00000000-0000-4000-8000-000000000099" },
    decision: { type: "string", enum: ["reopen"], example: "reopen" },
    comment: { type: "string", minLength: 1, maxLength: 2000 },
  },
};

export const ReviewPendingItemsResponse = {
  type: "object",
  required: ["batchId", "items"],
  properties: {
    batchId: { type: "string", format: "uuid" },
    items: { type: "array", items: { $ref: "#/components/schemas/PendingItem" } },
  },
};

export const RespondPendingItemBody = {
  type: "object",
  description:
    "Para `field_edit` envie `correctedValue`; para `observation` envie `response`. Exatamente um dos dois.",
  oneOf: [
    {
      required: ["correctedValue"],
      properties: {
        correctedValue: {
          oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { enum: [null] }],
          description: "Valor corrigido do campo.",
        },
      },
    },
    {
      required: ["response"],
      properties: {
        response: { type: "string", minLength: 1, maxLength: 2000 },
      },
    },
  ],
};

export const PublicVerifyBody = {
  type: "object",
  required: ["name", "email"],
  properties: {
    name: { type: "string", minLength: 3, maxLength: 150 },
    email: { type: "string", format: "email", maxLength: 254 },
    protocol: {
      type: "string",
      description:
        "Opcional; quando presente precisa ser idêntico ao `:protocol` da URL (anti-IDOR). Ausente = assume o protocolo da URL.",
    },
  },
};

export const PublicVerifyResponse = {
  type: "object",
  required: ["protocol", "canAccess"],
  properties: {
    protocol: { type: "string" },
    canAccess: { type: "boolean", example: true },
  },
};
