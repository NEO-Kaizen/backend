export const UserMetrics = {
  type: "object",
  required: ["total", "active", "pending", "admins"],
  properties: {
    total: { type: "integer", example: 15 },
    active: { type: "integer", example: 13 },
    pending: { type: "integer", example: 3 },
    admins: { type: "integer", example: 3 },
  },
};

export const UserListItem = {
  type: "object",
  required: ["id", "email", "name", "role", "isActive"],
  properties: {
    id: { type: "string", example: "101" },
    email: { type: "string", example: "analista_teste@email.com" },
    name: { type: "string", example: "Analista Teste" },
    role: { type: "string", example: "Analista" },
    isActive: { type: "boolean", example: true },
    avatarUrl: { type: "string", nullable: true },
  },
};
