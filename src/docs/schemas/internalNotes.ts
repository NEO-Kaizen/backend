export const TimelineActor = {
  type: "object",
  required: ["id", "name", "role"],
  properties: {
    id: { type: "string", example: "101" },
    name: { type: "string", example: "Analista Teste" },
    role: { type: "string", enum: ["Analista", "Gestor", "Administrador"] },
  },
};

export const TimelineNote = {
  type: "object",
  required: ["type", "id", "content", "createdAt", "author"],
  properties: {
    type: { type: "string", enum: ["note"] },
    id: { type: "string", description: "`internal_note_id` numérico como string." },
    content: { type: "string", maxLength: 4000 },
    createdAt: { type: "string", format: "date-time" },
    author: { $ref: "#/components/schemas/TimelineActor" },
  },
};

export const TimelineEvent = {
  type: "object",
  required: ["type", "id", "action", "text", "occurredAt", "actor", "changeOrigin"],
  properties: {
    type: { type: "string", enum: ["event"] },
    id: {
      type: "string",
      description: "`audit:<audit_id>`; a ação bruta de bypass é normalizada.",
      example: "audit:58",
    },
    action: {
      type: "string",
      enum: [
        "request.assign",
        "request.reassign",
        "request.unassign",
        "request.status_change",
        "mapping.assign",
      ],
    },
    text: {
      type: "string",
      description: "Frase completa já renderizada no backend, em pt-BR.",
      example: "Status alterado: Em triagem",
    },
    occurredAt: { type: "string", format: "date-time" },
    actor: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/TimelineActor" }],
      nullable: true,
      description: "`null` para ação de sistema ou usuário removido.",
    },
    changeOrigin: {
      type: "string",
      enum: ["admin", "system", "internal"],
      nullable: true,
    },
    justification: {
      type: "string",
      nullable: true,
      description: "Justificativa interna da transição; nunca o retorno público.",
    },
    lastTechnicalMessage: {
      type: "string",
      nullable: true,
      description: "Snapshot do retorno público da própria transição.",
    },
  },
};

export const TimelineItem = {
  oneOf: [
    { $ref: "#/components/schemas/TimelineNote" },
    { $ref: "#/components/schemas/TimelineEvent" },
  ],
  discriminator: { propertyName: "type" },
};

export const TriageHistoryEntry = {
  type: "object",
  required: ["triage", "occurredAt"],
  properties: {
    triage: { $ref: "#/components/schemas/TriagemResponse" },
    occurredAt: { type: "string", format: "date-time" },
  },
};

export const MappingHistoryEntry = {
  type: "object",
  required: ["mapping", "occurredAt"],
  properties: {
    mapping: { $ref: "#/components/schemas/MappingHistoryResponse" },
    occurredAt: { type: "string", format: "date-time" },
  },
};

export const InternalNotesResponse = {
  type: "object",
  required: ["items", "nextCursor", "unseenCount", "triages", "mappings"],
  properties: {
    items: {
      type: "array",
      description: "Página da timeline em ordem mais recente primeiro.",
      items: { $ref: "#/components/schemas/TimelineItem" },
    },
    nextCursor: {
      type: "string",
      nullable: true,
      description: "Cursor opaco; `null` quando não há página mais antiga.",
    },
    unseenCount: {
      type: "integer",
      description: "Notas de outros autores após o checkpoint de leitura; eventos não contam.",
    },
    triages: {
      type: "array",
      description: "Histórico completo, oldest → newest, idêntico em todas as páginas.",
      items: { $ref: "#/components/schemas/TriageHistoryEntry" },
    },
    mappings: {
      type: "array",
      description: "Histórico completo, oldest → newest, idêntico em todas as páginas.",
      items: { $ref: "#/components/schemas/MappingHistoryEntry" },
    },
  },
};

export const CreateInternalNoteRequest = {
  type: "object",
  required: ["content"],
  properties: {
    content: { type: "string", minLength: 1, maxLength: 4000 },
  },
};

export const MarkInternalNotesReadRequest = {
  type: "object",
  required: ["lastReadNoteId"],
  properties: {
    lastReadNoteId: {
      type: "string",
      pattern: "^[1-9]\\d*$",
      description: "`internal_note_id` numérico como string.",
    },
  },
};
