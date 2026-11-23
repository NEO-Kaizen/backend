const dateTime = { type: "string", format: "date-time" } as const;
const nullableDateTime = { type: "string", format: "date-time", nullable: true } as const;
const nullableString = { type: "string", nullable: true } as const;

/** Vocabulário de exibição dos status do ciclo de vida. */
export const RequestStatus = {
  type: "string",
  description:
    "Nome do Status do ciclo de vida (`statuses.name`). O catálogo é administrável em `PATCH /portal-config/statuses`; os 17 valores semeados são a referência base.",
  example: "Em triagem",
};

export const RequestPriority = {
  type: "string",
  enum: ["Baixa", "Média", "Alta", "Crítica"],
  example: "Alta",
};

export const RequestCategory = {
  type: "string",
  description:
    "Nome da categoria da solicitação (`categories.name`). O cadastro é administrável em `PATCH /portal-config/categories`; os 10 nomes base são: Automação, Melhoria de processo, Indicador, Dashboard ou relatório, Análise de dados, Padronização, Revisão de processo, Apoio técnico, Estudo de viabilidade, Outros.",
  maxLength: 40,
  example: "Automação",
};

/**
 * `YesNoDetail` — `false` para "Não"; string (inclusive vazia) para "Sim" +
 * detalhamento. Chave ausente quando o campo opcional não foi respondido.
 */
export const YesNoDetail = {
  oneOf: [{ type: "boolean", enum: [false] }, { type: "string" }],
  description: '`false` = "Não"; string = "Sim" + detalhamento.',
  example: "Planilha compartilhada no SharePoint",
};

export const RequesterBlock = {
  type: "object",
  required: ["fullName", "corporateEmail", "area", "manager"],
  properties: {
    fullName: { type: "string", maxLength: 150, example: "Maria Silva" },
    corporateEmail: {
      type: "string",
      format: "email",
      maxLength: 254,
      example: "maria.silva@empresa.com",
    },
    area: { type: "string", maxLength: 100, example: "TI" },
    department: { type: "string", maxLength: 100, example: "Desenvolvimento" },
    manager: { type: "string", maxLength: 150, example: "José Silva" },
    additionalContact: {
      type: "string",
      maxLength: 100,
      description: "Telefone, ramal ou e-mail secundário.",
      example: "+55 11 99999-0000",
    },
  },
};

export const DemandBlock = {
  type: "object",
  required: [
    "title",
    "requestType",
    "category",
    "processName",
    "description",
    "problem",
    "expectedResult",
    "justification",
  ],
  properties: {
    title: { type: "string", maxLength: 150, example: "Automatizar conciliação bancária" },
    requestType: { type: "string", maxLength: 80, example: "Automação" },
    category: { $ref: "#/components/schemas/RequestCategory" },
    processName: { type: "string", maxLength: 150, example: "Conciliação bancária mensal" },
    description: { type: "string", maxLength: 4000, example: "Descrição da necessidade." },
    problem: { type: "string", maxLength: 4000, example: "Problema ou oportunidade identificada." },
    expectedResult: { type: "string", maxLength: 4000, example: "Resultado esperado." },
    justification: { type: "string", maxLength: 4000, example: "Justificativa da solicitação." },
  },
};

export const OperationalBlock = {
  type: "object",
  required: [
    "processDescription",
    "processSteps",
    "systemsUsed",
    "executionFrequency",
    "volumetry",
    "peopleInvolved",
    "averageExecutionTime",
    "monthlyEffortHours",
    "hasManualControls",
    "mainRisks",
    "clientImpact",
    "operationalImpact",
    "desiredDeadline",
    "perceivedCriticality",
  ],
  properties: {
    processDescription: { type: "string", maxLength: 4000, example: "Descrição resumida." },
    processSteps: { type: "string", maxLength: 4000, example: "1. Receber; 2. Conferir." },
    systemsUsed: { type: "string", maxLength: 255, example: "Excel, SAP" },
    executionFrequency: { type: "string", maxLength: 50, example: "Mensal" },
    volumetry: { type: "string", maxLength: 100, example: "500 transações/mês" },
    peopleInvolved: { type: "integer", minimum: 1, example: 2 },
    averageExecutionTime: { type: "string", maxLength: 60, example: "15 minutos" },
    monthlyEffortHours: { type: "number", minimum: 0, example: 16.5 },
    hasManualControls: { $ref: "#/components/schemas/YesNoDetail" },
    mainRisks: { type: "string", maxLength: 2000, example: "Risco de divergência." },
    clientImpact: { type: "string", maxLength: 2000, example: "Impacto no cliente interno." },
    operationalImpact: {
      type: "string",
      enum: ["Baixo", "Médio", "Alto", "Crítico"],
      example: "Médio",
    },
    desiredDeadline: { type: "string", format: "date", example: "2026-12-31" },
    perceivedCriticality: { $ref: "#/components/schemas/RequestPriority" },
  },
};

export const ComplementaryBlock = {
  type: "object",
  properties: {
    hasProcessDocumentation: { $ref: "#/components/schemas/YesNoDetail" },
    hasSimilarSolution: { $ref: "#/components/schemas/YesNoDetail" },
    dependsOnOtherAreas: { $ref: "#/components/schemas/YesNoDetail" },
    handlesRestrictedInfo: { $ref: "#/components/schemas/YesNoDetail" },
    additionalNotes: { type: "string", maxLength: 2000 },
  },
};

export const CreateRequestPayload = {
  type: "object",
  required: ["requester", "demand", "operational"],
  properties: {
    requester: { $ref: "#/components/schemas/RequesterBlock" },
    demand: { $ref: "#/components/schemas/DemandBlock" },
    operational: { $ref: "#/components/schemas/OperationalBlock" },
    complementary: { $ref: "#/components/schemas/ComplementaryBlock" },
    schedulePreferences: {
      type: "array",
      maxItems: 3,
      items: { type: "string", example: "2026-09-15T13:30" },
      description: "Até 3 preferências de horário no formato `yyyy-mm-ddThh:mm`.",
    },
  },
};

export const CreateRequestResponse = {
  type: "object",
  required: ["protocol", "status", "createdAt"],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    status: { $ref: "#/components/schemas/RequestStatus" },
    createdAt: dateTime,
  },
};

export const RequestSummary = {
  type: "object",
  required: [
    "protocol",
    "createdAt",
    "processName",
    "priority",
    "status",
    "assignee",
    "requesterName",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    createdAt: dateTime,
    processName: { type: "string", example: "Conciliação bancária mensal" },
    priority: {
      type: "string",
      allOf: [{ $ref: "#/components/schemas/RequestPriority" }],
      nullable: true,
      description: "`null` enquanto a solicitação não foi priorizada.",
    },
    status: { $ref: "#/components/schemas/RequestStatus" },
    assignee: { ...nullableString, example: "Analista Teste" },
    requesterName: { type: "string", example: "Maria Silva" },
  },
};

export const PaginatedRequestSummary = {
  type: "object",
  required: ["data", "page", "pageSize", "total", "totalPages"],
  properties: {
    data: { type: "array", items: { $ref: "#/components/schemas/RequestSummary" } },
    page: { type: "integer", example: 1 },
    pageSize: { type: "integer", example: 10 },
    total: { type: "integer", example: 3 },
    totalPages: { type: "integer", example: 1 },
  },
};

export const PublicMeeting = {
  type: "object",
  required: ["scheduledFor", "link"],
  properties: {
    scheduledFor: dateTime,
    link: { ...nullableString, example: "https://meet.exemplo.com/sala" },
  },
};

export const PublicRequestDetail = {
  type: "object",
  required: [
    "protocol",
    "demandTitle",
    "processName",
    "status",
    "assigneeName",
    "openedAt",
    "estimatedCompletion",
    "mappingDate",
    "meeting",
    "pendingIssues",
    "nextStep",
    "lastTechnicalMessage",
    "lastUpdate",
    "conclusion",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    demandTitle: { type: "string", example: "Automatizar conciliação bancária" },
    processName: { type: "string", example: "Conciliação bancária mensal" },
    status: { $ref: "#/components/schemas/RequestStatus" },
    assigneeName: { ...nullableString, example: "Analista Teste" },
    openedAt: dateTime,
    estimatedCompletion: nullableDateTime,
    mappingDate: nullableDateTime,
    meeting: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/PublicMeeting" }],
      nullable: true,
    },
    pendingIssues: { type: "array", items: { type: "string" } },
    nextStep: { type: "string", example: "Aguardando mapeamento" },
    lastTechnicalMessage: {
      ...nullableString,
      example: "Sua solicitação avançou para mapeamento.",
    },
    lastUpdate: dateTime,
    conclusion: {
      type: "object",
      nullable: true,
      required: ["result", "justification"],
      properties: {
        result: { type: "string", example: "Elegível para avaliação" },
        justification: { type: "string" },
      },
    },
  },
};

export const Assignee = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id: {
      ...nullableString,
      description: "`users.user_id` como string.",
      example: "20",
    },
    name: { ...nullableString, example: "Analista Teste" },
    email: { ...nullableString, example: "analista@empresa.com" },
  },
};

export const PrioritizationBlock = {
  type: "object",
  required: ["score", "maxScore", "label"],
  properties: {
    score: {
      type: "number",
      multipleOf: 0.1,
      nullable: true,
      minimum: 10,
      maximum: 50,
      description: "`null` até a prioritização ser avaliada.",
      example: 34.5,
    },
    maxScore: { type: "integer", enum: [50], example: 50 },
    label: { ...nullableString, example: "Alta" },
  },
};

export const PendingSummary = {
  type: "object",
  required: ["total", "requested", "responded", "validated"],
  properties: {
    total: { type: "integer", example: 3 },
    requested: { type: "integer", example: 1 },
    responded: { type: "integer", example: 1 },
    validated: { type: "integer", example: 1 },
  },
};

export const UnreadState = {
  type: "object",
  required: ["count", "hasUnread", "lastUnreadAt"],
  properties: {
    count: { type: "integer", example: 2 },
    hasUnread: { type: "boolean", example: true },
    lastUnreadAt: nullableDateTime,
  },
};

export const CorrectionAlert = {
  type: "object",
  required: ["count", "batchId"],
  properties: {
    count: { type: "integer", example: 2 },
    batchId: { type: "string", format: "uuid" },
  },
};

export const InternalAttachment = {
  type: "object",
  required: ["fileName", "mimeType", "sizeBytes", "downloadUrl", "canDownload"],
  properties: {
    fileName: { type: "string", example: "comprovante.pdf" },
    mimeType: { type: "string", example: "application/pdf" },
    sizeBytes: { type: "integer", example: 1024 },
    downloadUrl: { ...nullableString, example: "/uploads/requests/abc.pdf" },
    canDownload: { type: "boolean", example: true },
  },
};

export const InternalRequestDetail = {
  type: "object",
  required: [
    "protocol",
    "status",
    "priority",
    "prioritization",
    "assignee",
    "correctionAlert",
    "pendingSummary",
    "unread",
    "requester",
    "demand",
    "operational",
    "schedulePreferences",
    "mappingDate",
    "meeting",
    "attachments",
    "openedAt",
    "lastUpdate",
    "internalObservations",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    status: { $ref: "#/components/schemas/RequestStatus" },
    priority: {
      type: "string",
      allOf: [{ $ref: "#/components/schemas/RequestPriority" }],
      nullable: true,
    },
    prioritization: { $ref: "#/components/schemas/PrioritizationBlock" },
    assignee: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/Assignee" }],
      nullable: true,
    },
    mappingAssignee: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/Assignee" }],
      nullable: true,
    },
    correctionAlert: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/CorrectionAlert" }],
      nullable: true,
    },
    pendingSummary: { $ref: "#/components/schemas/PendingSummary" },
    unread: { $ref: "#/components/schemas/UnreadState" },
    requester: { $ref: "#/components/schemas/RequesterBlock" },
    demand: { $ref: "#/components/schemas/DemandBlock" },
    operational: { $ref: "#/components/schemas/OperationalBlock" },
    complementary: { $ref: "#/components/schemas/ComplementaryBlock" },
    schedulePreferences: {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    mappingDate: nullableDateTime,
    meeting: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/PublicMeeting" }],
      nullable: true,
    },
    attachments: {
      type: "array",
      items: { $ref: "#/components/schemas/InternalAttachment" },
    },
    openedAt: dateTime,
    lastUpdate: dateTime,
    internalObservations: { ...nullableString, description: "Campo legado de texto livre." },
  },
};

export const UpdateRequesterBlock = {
  type: "object",
  required: ["area", "manager"],
  properties: {
    area: { type: "string", maxLength: 100 },
    department: { type: "string", maxLength: 100 },
    manager: { type: "string", maxLength: 150 },
    additionalContact: { type: "string", maxLength: 100 },
  },
};

export const UpdateInternalRequestPayload = {
  type: "object",
  required: ["requester", "demand", "operational"],
  description:
    "Substituição completa dos blocos editáveis: chave ausente = campo limpo (NULL). `fullName`/`corporateEmail` são imutáveis e ignorados.",
  properties: {
    requester: { $ref: "#/components/schemas/UpdateRequesterBlock" },
    demand: { $ref: "#/components/schemas/DemandBlock" },
    operational: { $ref: "#/components/schemas/OperationalBlock" },
    complementary: { $ref: "#/components/schemas/ComplementaryBlock" },
  },
};

export const RequestMutationAcknowledgement = {
  type: "object",
  required: ["protocol", "updated"],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    updated: { type: "boolean", example: true },
  },
  description:
    "Acknowledgement devolvido quando a mutação é permitida mas o ator não tem custódia de leitura sobre a linha; não revela conteúdo interno.",
};

export const PublicOperationalImpacts = {
  type: "object",
  required: [
    "mainRisks",
    "clientImpact",
    "operationalImpact",
    "perceivedCriticality",
    "desiredDeadline",
  ],
  properties: {
    mainRisks: { type: "string", maxLength: 2000 },
    clientImpact: { type: "string", maxLength: 2000 },
    operationalImpact: {
      type: "string",
      enum: ["Baixo", "Médio", "Alto", "Crítico"],
    },
    perceivedCriticality: { $ref: "#/components/schemas/RequestPriority" },
    desiredDeadline: { type: "string", format: "date" },
  },
};

export const RequesterOperational = {
  allOf: [
    { $ref: "#/components/schemas/PublicOperationalImpacts" },
    {
      type: "object",
      required: [
        "processDescription",
        "processSteps",
        "systemsUsed",
        "executionFrequency",
        "volumetry",
        "peopleInvolved",
        "averageExecutionTime",
        "monthlyEffortHours",
        "hasManualControls",
      ],
      properties: {
        processDescription: { type: "string" },
        processSteps: { type: "string" },
        systemsUsed: { type: "string" },
        executionFrequency: { type: "string" },
        volumetry: { type: "string" },
        peopleInvolved: { type: "integer" },
        averageExecutionTime: { type: "string" },
        monthlyEffortHours: { type: "number" },
        hasManualControls: {
          oneOf: [{ type: "boolean", enum: [false] }, { type: "string" }],
        },
      },
    },
  ],
};

export const RequesterAttachment = {
  type: "object",
  required: ["id", "fileName", "mimeType", "sizeBytes", "downloadUrl", "canDownload"],
  properties: {
    id: { type: "string" },
    fileName: { type: "string" },
    mimeType: { type: "string" },
    sizeBytes: { type: "integer" },
    downloadUrl: { type: "string" },
    canDownload: { type: "boolean" },
  },
};

export const PublicRequestDetails = {
  type: "object",
  required: [
    "protocol",
    "status",
    "openedAt",
    "lastUpdate",
    "lastTechnicalMessage",
    "meeting",
    "requester",
    "demand",
    "impacts",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    status: { $ref: "#/components/schemas/RequestStatus" },
    openedAt: dateTime,
    lastUpdate: dateTime,
    lastTechnicalMessage: nullableString,
    meeting: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/PublicMeeting" }],
      nullable: true,
    },
    requester: { $ref: "#/components/schemas/RequesterBlock" },
    demand: { $ref: "#/components/schemas/DemandBlock" },
    impacts: { $ref: "#/components/schemas/PublicOperationalImpacts" },
  },
};

export const RequesterRequestDetails = {
  type: "object",
  required: [
    "protocol",
    "status",
    "openedAt",
    "lastUpdate",
    "lastTechnicalMessage",
    "meeting",
    "requester",
    "demand",
    "operational",
    "schedulePreferences",
    "mappingDate",
    "attachments",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    status: { $ref: "#/components/schemas/RequestStatus" },
    openedAt: dateTime,
    lastUpdate: dateTime,
    lastTechnicalMessage: nullableString,
    meeting: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/PublicMeeting" }],
      nullable: true,
    },
    requester: { $ref: "#/components/schemas/RequesterBlock" },
    demand: { $ref: "#/components/schemas/DemandBlock" },
    operational: { $ref: "#/components/schemas/RequesterOperational" },
    complementary: { $ref: "#/components/schemas/ComplementaryBlock" },
    schedulePreferences: {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    mappingDate: nullableDateTime,
    attachments: {
      type: "array",
      items: { $ref: "#/components/schemas/RequesterAttachment" },
    },
  },
};

export const PublicTrackingResponse = {
  type: "object",
  required: ["mode", "details"],
  properties: {
    mode: { type: "string", enum: ["public"] },
    details: { $ref: "#/components/schemas/PublicRequestDetails" },
  },
};

export const AuthenticatedTrackingResponse = {
  type: "object",
  required: ["mode", "details"],
  properties: {
    mode: { type: "string", enum: ["authenticated"] },
    details: { $ref: "#/components/schemas/RequesterRequestDetails" },
  },
};

export const TrackingResponse = {
  oneOf: [
    { $ref: "#/components/schemas/PublicTrackingResponse" },
    { $ref: "#/components/schemas/AuthenticatedTrackingResponse" },
  ],
  discriminator: { propertyName: "mode" },
};

export const AssigneeSummary = {
  type: "object",
  required: ["id", "name", "email", "jobTitle", "capacity"],
  properties: {
    id: { type: "string", format: "uuid", description: "`details_professional.professional_id`." },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    jobTitle: { ...nullableString },
    capacity: { type: "integer", example: 6 },
  },
};

export const AssignRequestPayload = {
  type: "object",
  description:
    "Rota legada. O schema atual aceita payload vazio (`{}`) e trata como remoção do responsável — comportamento conhecido e indesejado; envie `professionalId` explicitamente.",
  properties: {
    professionalId: {
      type: "string",
      format: "uuid",
      nullable: true,
      description: "`details_professional.professional_id` (UUID); `null` remove a atribuição.",
    },
  },
};

export const AssignRequestResponse = {
  type: "object",
  required: ["protocol", "assignee", "status"],
  properties: {
    protocol: { type: "string" },
    assignee: {
      type: "object",
      nullable: true,
      required: ["id", "name", "email"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
    status: { $ref: "#/components/schemas/RequestStatus" },
  },
};

export const AssignAnalystPayload = {
  type: "object",
  description:
    'Exatamente um de `assigneeId` ou `mappingAssigneeId` deve estar presente. Ambos são `users.user_id` numérico em string (ex.: `"20"`), não UUID.',
  properties: {
    assigneeId: {
      type: "string",
      pattern: "^[1-9]\\d*$",
      nullable: true,
      description: "`users.user_id` do responsável de triagem; `null` remove.",
      example: "20",
    },
    mappingAssigneeId: {
      type: "string",
      pattern: "^[1-9]\\d*$",
      nullable: true,
      description:
        "`users.user_id` do designado do mapeamento nesta rota; `null` remove. Diferente de `PUT /queue/requests/{protocol}/mapping`, que usa `professional_id` (UUID).",
      example: "22",
    },
  },
};

export const UpdateStatusPayload = {
  type: "object",
  required: ["targetStatus", "justification"],
  additionalProperties: false,
  properties: {
    targetStatus: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      description: "`PortalStatus.id` de destino.",
    },
    justification: {
      type: "string",
      minLength: 1,
      maxLength: 4000,
      description: "Justificativa interna obrigatória em toda troca de status.",
    },
    lastTechnicalMessage: {
      type: "string",
      minLength: 1,
      maxLength: 4000,
      nullable: true,
      description:
        "Retorno ao solicitante. Obrigatório quando o Status de destino é público (`isPublic = true`).",
    },
  },
};

export const UpdateStatusResponse = {
  type: "object",
  required: ["protocol", "status", "previous", "next", "lastUpdate"],
  properties: {
    protocol: { type: "string" },
    status: { type: "string" },
    previous: { type: "string" },
    next: { type: "string" },
    lastUpdate: dateTime,
  },
};
