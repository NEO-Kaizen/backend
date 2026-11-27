export const PrioritizationCriteria = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    weight: { type: "number", minimum: 0, maximum: 10 },
  },
};
