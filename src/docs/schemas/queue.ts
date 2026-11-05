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

export const QueueItem = {
  type: "object",
  required: [
    "protocol",
    "createdAt",
    "processName",
    "priority",
    "status",
    "assignee",
    "requesterName",
    "requesterEmail",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    createdAt: { type: "string", format: "date-time" },
    processName: { type: "string", example: "Conciliação bancária mensal" },
    priority: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"], example: "Alta" },
    status: { type: "string", example: "Em triagem" },
    assignee: { type: "string", nullable: true, example: "Analista Teste" },
    assigneeId: { type: "string", nullable: true, example: "650e8400-e29b-41d4-a716-446655440001" },
    requesterName: { type: "string", example: "Fabio Solicitante" },
    requesterEmail: { type: "string", example: "fabio.solicitante@email.com" },
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
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "650e8400-e29b-41d4-a716-446655440001" },
          name: { type: "string", example: "Analista Teste" },
        },
      },
    },
  },
};
