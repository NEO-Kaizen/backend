export const PortalConfig = {
  type: "object",
  properties: {
    identity: { type: "object" },
    access: { type: "object" },
    theme: { type: "object" },
    assets: { type: "object" },
    categories: { type: "array" },
    statuses: { type: "array" },
    prioritizationWeights: { type: "object" },
  },
};
