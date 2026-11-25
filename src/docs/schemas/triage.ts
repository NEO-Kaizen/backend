export const TriageAssignee = {
  type: "object",
  required: ["id", "name", "email"],
  properties: {
    id: { type: "string", nullable: true },
    name: { type: "string", nullable: true },
    email: { type: "string", nullable: true },
  },
};

export const TriagemResponse = {
  type: "object",
  required: [
    "id",
    "adherentToScope",
    "adherentJustification",
    "changeCategory",
    "newCategory",
    "preliminaryComplexity",
    "perceivedRisks",
    "suggestedResponsible",
    "suggestedResponsibleJustification",
    "exitStatus",
    "result",
    "conclusionJustification",
    "assignee",
    "lastTechnicalMessage",
  ],
  properties: {
    id: { type: "string", format: "uuid", description: "UUID do registro de triagem." },
    adherentToScope: { type: "string", enum: ["Sim", "Não", ""] },
    adherentJustification: { type: "string", maxLength: 1000 },
    changeCategory: { type: "string", enum: ["Sim", "Não", ""] },
    newCategory: {
      type: "string",
      maxLength: 40,
      description: "Nome da categoria ativa; string vazia quando não houve troca.",
    },
    preliminaryComplexity: { type: "string", maxLength: 4000 },
    perceivedRisks: { type: "string", maxLength: 4000 },
    suggestedResponsible: { type: "string", maxLength: 150 },
    suggestedResponsibleJustification: { type: "string", maxLength: 1000 },
    exitStatus: { type: "integer", description: "`PortalStatus.id` de saída." },
    result: { type: "string", maxLength: 1000 },
    conclusionJustification: { type: "string", maxLength: 4000 },
    assignee: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/TriageAssignee" }],
      nullable: true,
    },
    lastTechnicalMessage: {
      type: "string",
      maxLength: 4000,
      nullable: true,
      description: "Retorno ao solicitante; obrigatório quando o Status de saída é público.",
    },
  },
};

/**
 * Corpo do POST /requests/:protocol/triage. `adherentToScope` e `changeCategory`
 * não aceitam `""` na criação; os campos condicionais são validados pelo service.
 */
export const CreateTriagePayload = {
  type: "object",
  required: [
    "adherentToScope",
    "changeCategory",
    "exitStatus",
    "result",
    "conclusionJustification",
  ],
  additionalProperties: false,
  properties: {
    adherentToScope: {
      type: "string",
      enum: ["Sim", "Não"],
      description: "Obrigatório.",
    },
    adherentJustification: {
      type: "string",
      maxLength: 1000,
      default: "",
      description: 'Obrigatório quando `adherentToScope = "Não"` (1..1000).',
    },
    changeCategory: { type: "string", enum: ["Sim", "Não"], description: "Obrigatório." },
    newCategory: {
      type: "string",
      maxLength: 40,
      default: "",
      description:
        'Obrigatório quando `changeCategory = "Sim"`; deve ser uma categoria ativa. Ignorado caso contrário.',
    },
    preliminaryComplexity: {
      type: "string",
      maxLength: 4000,
      default: "",
      description: 'Obrigatório quando `adherentToScope = "Sim"` (1..4000).',
    },
    perceivedRisks: {
      type: "string",
      maxLength: 4000,
      default: "",
      description: 'Obrigatório quando `adherentToScope = "Sim"` (1..4000).',
    },
    suggestedResponsible: { type: "string", maxLength: 150, default: "" },
    suggestedResponsibleJustification: { type: "string", maxLength: 1000, default: "" },
    exitStatus: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      description:
        "`PortalStatus.id` ativo, não restrito e com `triageMode` de conclusão. Literais antigos (nomes) são rejeitados.",
    },
    result: { type: "string", minLength: 1, maxLength: 1000 },
    conclusionJustification: { type: "string", minLength: 1, maxLength: 4000 },
    lastTechnicalMessage: {
      type: "string",
      minLength: 1,
      maxLength: 4000,
      nullable: true,
      description: "Obrigatório quando o Status de saída é público (`isPublic = true`).",
    },
  },
};
