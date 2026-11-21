export const QueueMetrics = {
  type: "object",
  required: ["totalRequests", "unassignedRequests", "inProgressRequests", "overdueRequests"],
  properties: {
    totalRequests: { type: "integer", example: 128 },
    unassignedRequests: { type: "integer", example: 31 },
    inProgressRequests: { type: "integer", example: 54 },
    overdueRequests: { type: "integer", example: 9 },
  },
};

export const QueueAssignee = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id: { type: "string", description: "`users.user_id` como string." },
    name: { type: "string" },
  },
};

export const QueueItem = {
  type: "object",
  required: [
    "protocol",
    "createdAt",
    "processName",
    "priority",
    "status",
    "assignee",
    "assigneeId",
    "requesterName",
    "requesterEmail",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    createdAt: { type: "string", format: "date-time" },
    processName: { type: "string", example: "Conciliação bancária mensal" },
    priority: {
      type: "string",
      enum: ["Baixa", "Média", "Alta", "Crítica"],
      nullable: true,
      example: "Alta",
    },
    status: { type: "string", example: "Em triagem" },
    assignee: { type: "string", nullable: true, example: "Analista Teste" },
    assigneeId: {
      type: "string",
      nullable: true,
      description: "`users.user_id` do responsável de triagem, como string.",
      example: "20",
    },
    requesterName: { type: "string", example: "Fabio Solicitante" },
    requesterEmail: { type: "string", format: "email", example: "fabio.solicitante@email.com" },
  },
};

export const QueueResponse = {
  type: "object",
  required: ["data", "page", "pageSize", "total", "totalPages", "assignees"],
  properties: {
    data: { type: "array", items: { $ref: "#/components/schemas/QueueItem" } },
    page: { type: "integer", example: 1 },
    pageSize: { type: "integer", example: 10 },
    total: { type: "integer", example: 42 },
    totalPages: { type: "integer", example: 5 },
    assignees: {
      type: "array",
      description: "Responsáveis elegíveis para o filtro da fila.",
      items: { $ref: "#/components/schemas/QueueAssignee" },
    },
  },
};

export const MappingParticipant = {
  type: "object",
  required: ["id", "name", "email"],
  properties: {
    id: {
      type: "string",
      nullable: true,
      description: "`users.user_id` como string; `null` para participante externo.",
    },
    name: { type: "string" },
    email: { type: "string", format: "email" },
  },
};

export const MappingParticipantInput = {
  type: "object",
  required: ["name", "email"],
  properties: {
    id: {
      type: "string",
      description:
        "`users.user_id` (string numérica). Ausente = participante externo; o nome/e-mail do payload é usado.",
    },
    name: { type: "string" },
    email: { type: "string", format: "email" },
  },
};

export const MappingAssignee = {
  type: "object",
  required: ["id", "userId", "name", "email", "jobTitle"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "`details_professional.professional_id`.",
    },
    userId: { type: "string", description: "`users.user_id` como string." },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    jobTitle: { type: "string", nullable: true },
  },
};

export const MappingResponse = {
  type: "object",
  required: [
    "protocol",
    "id",
    "targetStatus",
    "scheduledFor",
    "durationMinutes",
    "modality",
    "meetingLink",
    "location",
    "participants",
    "notes",
    "mappingAssignee",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    id: {
      type: "string",
      format: "uuid",
      nullable: true,
      description: "`mapping_id` (uuid); `null` no estado vazio.",
    },
    targetStatus: {
      type: "integer",
      nullable: true,
      description: "`PortalStatus.id` de destino registrado no mapeamento.",
    },
    scheduledFor: { type: "string", format: "date-time", nullable: true },
    durationMinutes: { type: "integer", minimum: 15, maximum: 480, nullable: true },
    modality: { type: "string", enum: ["REMOTE", "IN_PERSON"], nullable: true },
    meetingLink: { type: "string", nullable: true },
    location: { type: "string", nullable: true },
    participants: {
      type: "array",
      items: { $ref: "#/components/schemas/MappingParticipant" },
    },
    notes: { type: "string", nullable: true },
    mappingAssignee: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/MappingAssignee" }],
      nullable: true,
    },
  },
};

export const MappingHistoryResponse = {
  allOf: [
    { $ref: "#/components/schemas/MappingResponse" },
    {
      type: "object",
      properties: {
        justification: {
          type: "string",
          nullable: true,
          description: "Justificativa interna da conclusão (somente histórico).",
        },
        lastTechnicalMessage: {
          type: "string",
          nullable: true,
          description: "Snapshot do retorno público da conclusão (somente histórico).",
        },
      },
    },
  ],
};

export const MappingPayload = {
  type: "object",
  required: ["completeMapping"],
  description:
    "Campo ausente mantém o valor atual; `null` limpa (exceto `targetStatus`/`justification`/`lastTechnicalMessage`, usados somente na conclusão). `participants` presente substitui a lista por completo. Modalidade REMOTE exige `meetingLink` e IN_PERSON exige `location`, inclusive em rascunho.",
  properties: {
    id: { type: "string", format: "uuid", description: "`mapping_id` quando já existe." },
    mappingAssigneeId: {
      type: "string",
      format: "uuid",
      nullable: true,
      description:
        "`details_professional.professional_id` do executor do mapeamento (`mappings.professional_id`). Não altera a custódia em `requests.mapping_professional_id`. Permitido ao Administrador, ao responsável da solicitação ou ao designado atual.",
    },
    scheduledFor: { type: "string", format: "date-time", nullable: true },
    durationMinutes: { type: "integer", minimum: 15, maximum: 480, nullable: true },
    modality: { type: "string", enum: ["REMOTE", "IN_PERSON"], nullable: true },
    meetingLink: { type: "string", nullable: true },
    location: { type: "string", nullable: true },
    participants: {
      type: "array",
      items: { $ref: "#/components/schemas/MappingParticipantInput" },
    },
    notes: { type: "string", nullable: true },
    completeMapping: {
      type: "boolean",
      description: "Exclusivo do PUT (não aparece na resposta).",
    },
    targetStatus: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      description:
        "Obrigatório quando `completeMapping: true`; precisa ter `mappingMode = conclusion_only` e não ser restrito.",
    },
    justification: {
      type: "string",
      minLength: 1,
      maxLength: 4000,
      description:
        "Obrigatória ao concluir para destino diferente de `Mapeamento agendado` (id 6).",
    },
    lastTechnicalMessage: {
      type: "string",
      minLength: 1,
      maxLength: 4000,
      nullable: true,
      description:
        "Obrigatório quando o Status de destino é público (`isPublic = true`). Ignorado quando o destino é `Mapeamento agendado` (id 6).",
    },
  },
};
