export const DashboardSituation = {
  type: "string",
  enum: ["open", "closed", "overdue", "unassigned"],
};

export const DashboardSummary = {
  type: "object",
  required: ["total", "open", "closed", "overdue", "unassigned"],
  properties: {
    total: { type: "integer", example: 20 },
    open: { type: "integer", description: "Status com `is_terminal = false`.", example: 18 },
    closed: { type: "integer", description: "Status com `is_terminal = true`.", example: 2 },
    overdue: {
      type: "integer",
      description: "Abertas com `desired_deadline` anterior ao dia atual.",
      example: 0,
    },
    unassigned: {
      type: "integer",
      description: "Abertas sem `professional_id`.",
      example: 5,
    },
  },
};

export const DashboardStatusMetric = {
  type: "object",
  required: ["id", "name", "count", "tone", "closesRequest"],
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    count: { type: "integer" },
    tone: { type: "string", enum: ["error", "success", "info", "warning", "neutral"] },
    closesRequest: {
      type: "boolean",
      description: "Nome legado de `statuses.is_terminal`; o valor é espelho de `isTerminal`.",
    },
  },
};

export const DashboardPriorityMetric = {
  type: "object",
  required: ["id", "label", "count"],
  properties: {
    id: { type: "integer", nullable: true },
    label: {
      type: "string",
      enum: ["Baixa", "Média", "Alta", "Crítica", "Não priorizada"],
    },
    count: { type: "integer" },
  },
};

export const DashboardCategoryMetric = {
  type: "object",
  required: ["id", "name", "count"],
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    count: { type: "integer" },
  },
};

export const DashboardTrendPoint = {
  type: "object",
  required: ["period", "count"],
  properties: {
    period: { type: "string", example: "2026-07" },
    count: { type: "integer" },
  },
};

export const DashboardResponse = {
  type: "object",
  required: [
    "filters",
    "filterOptions",
    "summary",
    "byStatus",
    "byPriority",
    "byCategory",
    "openedOverTime",
  ],
  properties: {
    filters: {
      type: "object",
      required: ["from", "to", "situation", "statusId", "categoryId", "priorityId"],
      properties: {
        from: { type: "string", format: "date", nullable: true },
        to: { type: "string", format: "date", nullable: true },
        situation: {
          type: "string",
          allOf: [{ $ref: "#/components/schemas/DashboardSituation" }],
          nullable: true,
        },
        statusId: { type: "integer", nullable: true },
        categoryId: { type: "integer", nullable: true },
        priorityId: {
          oneOf: [{ type: "integer" }, { type: "string", enum: ["unassigned"] }, { enum: [null] }],
        },
      },
    },
    filterOptions: {
      type: "object",
      required: ["statuses", "categories", "priorities"],
      properties: {
        statuses: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "name"],
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
        },
        categories: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "name"],
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
        },
        priorities: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "label"],
            properties: {
              id: { type: "integer" },
              label: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"] },
            },
          },
        },
      },
    },
    summary: { $ref: "#/components/schemas/DashboardSummary" },
    byStatus: {
      type: "array",
      items: { $ref: "#/components/schemas/DashboardStatusMetric" },
    },
    byPriority: {
      type: "array",
      items: { $ref: "#/components/schemas/DashboardPriorityMetric" },
    },
    byCategory: {
      type: "array",
      items: { $ref: "#/components/schemas/DashboardCategoryMetric" },
    },
    openedOverTime: {
      type: "array",
      items: { $ref: "#/components/schemas/DashboardTrendPoint" },
    },
  },
};
