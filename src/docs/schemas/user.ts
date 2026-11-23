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

export const UserSummary = {
  type: "object",
  required: [
    "id",
    "fullName",
    "email",
    "avatarUrl",
    "profile",
    "isActive",
    "mustChangePassword",
    "createdAt",
  ],
  properties: {
    id: { type: "string", example: "101" },
    fullName: { type: "string", example: "Analista Teste" },
    email: { type: "string", example: "analista_teste@email.com" },
    avatarUrl: { type: "string", nullable: true, example: "/uploads/avatars/101-foto.jpg" },
    profile: { $ref: "#/components/schemas/ProfileReference" },
    isActive: { type: "boolean", example: true },
    mustChangePassword: { type: "boolean", example: false },
    createdAt: { type: "string", format: "date-time", example: "2026-11-23T12:00:00.000Z" },
  },
};

export const CreateUserResponse = {
  type: "object",
  required: [
    "id",
    "fullName",
    "email",
    "profile",
    "isActive",
    "mustChangePassword",
    "createdAt",
    "temporaryPassword",
  ],
  properties: {
    id: { type: "string", example: "101" },
    fullName: { type: "string", example: "Maria Silva" },
    email: { type: "string", format: "email", example: "maria.silva@empresa.com" },
    profile: { $ref: "#/components/schemas/ProfileReference" },
    isActive: { type: "boolean", example: true },
    mustChangePassword: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time", example: "2026-11-23T12:00:00.000Z" },
    temporaryPassword: { type: "string", example: "Abc123!xyz" },
  },
};

export const ChangeUserStatusResponse = {
  type: "object",
  required: ["id", "isActive"],
  properties: {
    id: { type: "string", example: "101" },
    isActive: { type: "boolean", example: false },
  },
};

export const AssignableProfessional = {
  type: "object",
  required: ["id", "fullName", "email", "specialty", "categories", "notes", "requestLoad"],
  properties: {
    id: { type: "string", example: "101" },
    fullName: { type: "string", example: "Maria Silva" },
    email: { type: "string", format: "email", example: "maria.silva@empresa.com" },
    specialty: { type: "string", example: "Analista de Sistemas" },
    categories: {
      type: "array",
      items: { type: "string" },
      example: ["Sistemas", "Automação"],
    },
    notes: { type: "string", nullable: true, example: "Atende à tarde." },
    requestLoad: { type: "integer", example: 3 },
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
  required: ["id", "fullName", "email", "profile", "avatarUrl", "requester", "professional"],
  properties: {
    id: { type: "string", example: "101" },
    fullName: { type: "string", example: "Maria Silva" },
    email: { type: "string", example: "maria.silva@empresa.com" },
    profile: { $ref: "#/components/schemas/ProfileReference" },
    avatarUrl: { type: ["string", "null"], example: "/uploads/avatars/1-foto.jpg" },
    requester: { $ref: "#/components/schemas/RequesterProfileBlock" },
    professional: { $ref: "#/components/schemas/ProfessionalProfileBlock" },
  },
};
