/**
 * Linha do tempo de uma solicitação: Notas internas + eventos de auditoria.
 *
 * `author`/`actor` carregam um snapshot do Perfil. Em notas antigas o `id` do
 * Perfil é `null` (só o nome foi preservado) e em eventos anteriores ao
 * snapshot o Perfil inteiro é `null` — nenhum ID é inferido do nome.
 */
export const TimelineActor = {
  type: "object",
  required: ["id", "name", "profile"],
  properties: {
    id: { type: "string", example: "101" },
    name: { type: "string", example: "Maria Silva" },
    profile: {
      nullable: true,
      allOf: [{ $ref: "#/components/schemas/ProfileSnapshot" }],
      description:
        "Snapshot do Perfil. `null` quando o evento não registrou Perfil; em notas antigas, `profile.id` é `null`.",
    },
  },
};

export const TimelineNote = {
  type: "object",
  required: ["type", "id", "content", "createdAt", "author"],
  properties: {
    type: { type: "string", enum: ["note"], example: "note" },
    id: { type: "string", example: "42" },
    content: { type: "string", example: "Nota importante sobre a solicitação" },
    createdAt: { type: "string", format: "date-time", example: "2026-11-23T12:00:00.000Z" },
    author: { $ref: "#/components/schemas/TimelineActor" },
  },
};

export const TimelineEvent = {
  type: "object",
  required: ["type", "id", "action", "text", "occurredAt", "actor", "changeOrigin"],
  properties: {
    type: { type: "string", enum: ["event"], example: "event" },
    id: { type: "string", example: "audit:900" },
    action: {
      type: "string",
      enum: [
        "request.assign",
        "request.reassign",
        "request.unassign",
        "request.status_change",
        "mapping.assign",
      ],
      example: "request.status_change",
    },
    text: { type: "string", example: "Status alterado: Em análise" },
    occurredAt: { type: "string", format: "date-time", example: "2026-11-23T12:00:00.000Z" },
    actor: {
      nullable: true,
      allOf: [{ $ref: "#/components/schemas/TimelineActor" }],
      description: "`null` em ações de sistema.",
    },
    changeOrigin: {
      type: "string",
      nullable: true,
      enum: ["admin", "system", "internal"],
      example: "internal",
    },
    justification: { type: "string", nullable: true },
    lastTechnicalMessage: { type: "string", nullable: true },
  },
};

export const InternalNotesResponse = {
  type: "object",
  required: ["items", "nextCursor", "unseenCount", "triages", "mappings"],
  properties: {
    items: {
      type: "array",
      items: {
        oneOf: [
          { $ref: "#/components/schemas/TimelineNote" },
          { $ref: "#/components/schemas/TimelineEvent" },
        ],
      },
    },
    nextCursor: { type: "string", nullable: true, example: "eyJ0IjoiMjAyNi0xMS0yM1QxMjowMDowMFoi" },
    unseenCount: { type: "integer", example: 0 },
    triages: { type: "array", items: { type: "object" } },
    mappings: { type: "array", items: { type: "object" } },
  },
};
