export const RequestSummary = {
  type: "object",
  required: ["protocol", "title", "status", "createdAt"],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    title: { type: "string", example: "Automatizar conciliação bancária" },
    status: { type: "string", example: "Solicitação enviada" },
    createdAt: { type: "string", format: "date-time", example: "2026-08-25T14:03:11.000Z" },
    updatedAt: { type: "string", format: "date-time", nullable: true },
  },
};

export const RequestDetail = {
  type: "object",
  required: ["protocol", "demandTitle", "processName", "status", "openedAt"],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    demandTitle: { type: "string", example: "Automatizar conciliação bancária" },
    processName: { type: "string", example: "Conciliação bancária mensal" },
    status: { type: "string", example: "Em triagem" },
    assigneeName: { type: "string", nullable: true, example: "Analista Teste" },
    openedAt: { type: "string", format: "date-time" },
    estimatedCompletion: { type: "string", nullable: true },
    mappingDate: { type: "string", nullable: true },
    meeting: {
      type: "object",
      properties: {
        scheduledFor: { type: "string", format: "date-time", nullable: true },
        link: { type: "string", nullable: true },
      },
    },
    pendingIssues: { type: "array", items: { type: "string" } },
    nextStep: { type: "string", nullable: true },
    lastTechnicalMessage: { type: "string", nullable: true },
    lastUpdate: { type: "string", format: "date-time", nullable: true },
    conclusion: { type: "string", nullable: true },
  },
};
