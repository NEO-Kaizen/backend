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

export const RequesterProfileBlock = {
  type: "object",
  required: ["area", "department", "manager", "additionalContact"],
  properties: {
    area: { type: "string", nullable: true, example: "TI" },
    department: { type: ["string", "null"], example: "Desenvolvimento" },
    manager: { type: "string", nullable: true, example: "José Silva" },
    additionalContact: { type: ["string", "null"], example: "contato@email.com" },
  },
};

export const ProfessionalProfileBlock = {
  type: "object",
  required: ["jobTitle", "specialties", "attendedCategoryIds", "notes"],
  properties: {
    jobTitle: { type: ["string", "null"], example: "Analista de Sistemas" },
    specialties: { type: "array", items: { type: "string" }, example: ["Sistemas", "Automação"] },
    attendedCategoryIds: { type: "array", items: { type: "integer" }, example: [1, 2] },
    notes: { type: ["string", "null"], example: "Analista sênior" },
  },
};

export const UserProfileResponse = {
  type: "object",
  required: ["id", "fullName", "email", "role", "avatarUrl", "requester", "professional"],
  properties: {
    id: { type: "string", example: "101" },
    fullName: { type: "string", example: "Maria Silva" },
    email: { type: "string", example: "maria.silva@empresa.com" },
    role: { type: "string", example: "Analista" },
    avatarUrl: { type: ["string", "null"], example: "/uploads/avatars/1-foto.jpg" },
    requester: { $ref: "#/components/schemas/RequesterProfileBlock" },
    professional: { $ref: "#/components/schemas/ProfessionalProfileBlock" },
  },
};
