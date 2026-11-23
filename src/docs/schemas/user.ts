export const UserListItem = {
  type: "object",
  required: ["id", "email", "name", "role", "isActive"],
  properties: {
    id: { type: "string", example: "101" },
    email: { type: "string", example: "analista_teste@email.com" },
    name: { type: "string", example: "Analista Teste" },
    role: { type: "string", example: "analista" },
    isActive: { type: "boolean", example: true },
    avatarUrl: { type: "string", nullable: true },
  },
};

/** Vocabulário de exibição do Perfil (capitalizado) usado nas respostas. */
export const Role = {
  type: "string",
  enum: ["Solicitante", "Analista", "Gestor", "Administrador"],
  example: "Analista",
};

/** Nome do Perfil em `profiles.name` (minúsculo), usado nos payloads de escrita. */
export const ProfileName = {
  type: "string",
  enum: ["solicitante", "analista", "gestor", "administrador"],
  description:
    "Nome do Perfil em `profiles.name` (minúsculo). Hoje `resolveRole` aceita apenas estes quatro nomes; perfis customizados ainda não estão implementados.",
  example: "analista",
};

export const UserMetrics = {
  type: "object",
  required: ["total", "active", "pending", "admins"],
  properties: {
    total: {
      type: "integer",
      description: "Todos os usuários cadastrados, ativos ou não.",
      example: 15,
    },
    active: {
      type: "integer",
      description: "Usuários com `is_active = true`.",
      example: 13,
    },
    pending: {
      type: "integer",
      description: "Usuários com troca de senha pendente (`must_change_password = true`).",
      example: 3,
    },
    admins: {
      type: "integer",
      description: "Usuários vinculados ao perfil `administrador`.",
      example: 3,
    },
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
    fullName: { type: "string", example: "Maria Silva" },
    email: { type: "string", format: "email", example: "maria.silva@empresa.com" },
    avatarUrl: { type: "string", nullable: true, example: "/uploads/avatars/101-foto.jpg" },
    profile: { $ref: "#/components/schemas/Role" },
    isActive: { type: "boolean", example: true },
    mustChangePassword: { type: "boolean", example: false },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const UserListResponse = {
  type: "object",
  required: ["data", "page", "pageSize", "total", "totalPages"],
  properties: {
    data: { type: "array", items: { $ref: "#/components/schemas/UserSummary" } },
    page: { type: "integer", example: 1 },
    pageSize: { type: "integer", example: 10 },
    total: { type: "integer", example: 15 },
    totalPages: { type: "integer", example: 2 },
  },
};

export const RequesterProfileBlock = {
  type: "object",
  required: ["area", "department", "manager", "additionalContact"],
  properties: {
    area: { type: "string", nullable: true, example: "TI" },
    department: { type: "string", nullable: true, example: "Desenvolvimento" },
    manager: { type: "string", nullable: true, example: "José Silva" },
    additionalContact: { type: "string", nullable: true, example: "contato@email.com" },
  },
};

export const ProfessionalProfileBlock = {
  type: "object",
  required: ["jobTitle", "specialties", "attendedCategoryIds", "notes"],
  properties: {
    jobTitle: { type: "string", nullable: true, example: "Analista de Sistemas" },
    specialties: { type: "array", items: { type: "string" }, example: ["Sistemas", "Automação"] },
    attendedCategoryIds: { type: "array", items: { type: "integer" }, example: [1, 2] },
    notes: { type: "string", nullable: true, example: "Analista sênior" },
  },
};

export const UserProfileResponse = {
  type: "object",
  required: ["id", "fullName", "email", "role", "avatarUrl", "requester", "professional"],
  properties: {
    id: { type: "string", example: "101" },
    fullName: { type: "string", example: "Maria Silva" },
    email: { type: "string", format: "email", example: "maria.silva@empresa.com" },
    role: { $ref: "#/components/schemas/Role" },
    avatarUrl: { type: "string", nullable: true, example: "/uploads/avatars/1-foto.jpg" },
    requester: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/RequesterProfileBlock" }],
      nullable: true,
    },
    professional: {
      type: "object",
      allOf: [{ $ref: "#/components/schemas/ProfessionalProfileBlock" }],
      nullable: true,
    },
  },
};

export const AssignAnalyst = {
  type: "object",
  required: ["id", "fullName", "email", "specialty", "categories", "notes", "requestLoad"],
  properties: {
    id: { type: "string", description: "`users.user_id` como string." },
    fullName: { type: "string" },
    email: { type: "string", format: "email" },
    specialty: {
      type: "string",
      description: 'Cargo do analista; string vazia permitida ("".).',
    },
    categories: {
      type: "array",
      items: { type: "string" },
      description: "Nomes das categorias atendidas; lista vazia permitida.",
    },
    notes: { type: "string", nullable: true },
    requestLoad: {
      type: "integer",
      nullable: true,
      description: "Solicitações atribuídas; `null` quando não calculado.",
    },
  },
};

export const RequesterInput = {
  type: "object",
  required: ["area", "manager"],
  properties: {
    area: { type: "string", maxLength: 100 },
    department: { type: "string", maxLength: 100 },
    manager: { type: "string", maxLength: 150 },
    additionalContact: { type: "string", nullable: true, maxLength: 100 },
  },
};

export const ProfessionalInput = {
  type: "object",
  required: ["jobTitle", "specialties", "attendedCategoryIds"],
  properties: {
    jobTitle: { type: "string", maxLength: 100 },
    specialties: {
      type: "array",
      minItems: 1,
      items: { type: "string", maxLength: 100 },
    },
    attendedCategoryIds: {
      type: "array",
      minItems: 1,
      items: { type: "integer", minimum: 1 },
    },
    notes: { type: "string", maxLength: 500, nullable: true },
  },
};

export const CreateUserRequest = {
  type: "object",
  required: ["fullName", "email", "role", "requester"],
  properties: {
    fullName: { type: "string", maxLength: 150 },
    email: { type: "string", format: "email" },
    role: { $ref: "#/components/schemas/ProfileName" },
    requester: { $ref: "#/components/schemas/RequesterInput" },
    professional: {
      allOf: [{ $ref: "#/components/schemas/ProfessionalInput" }],
      description: "Obrigatório quando `role = analista`; proibido para os demais perfis.",
    },
  },
};

export const CreateUserResponse = {
  type: "object",
  required: [
    "id",
    "fullName",
    "email",
    "role",
    "isActive",
    "mustChangePassword",
    "createdAt",
    "temporaryPassword",
  ],
  properties: {
    id: { type: "string" },
    fullName: { type: "string" },
    email: { type: "string", format: "email" },
    role: { $ref: "#/components/schemas/Role" },
    isActive: { type: "boolean" },
    mustChangePassword: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    temporaryPassword: {
      type: "string",
      description: "Senha temporária exibida uma única vez; não recuperável depois.",
    },
  },
};

export const UpdateUserRequest = {
  type: "object",
  properties: {
    fullName: { type: "string", maxLength: 150 },
    email: { type: "string", format: "email" },
    role: { $ref: "#/components/schemas/ProfileName" },
    professional: {
      allOf: [{ $ref: "#/components/schemas/ProfessionalInput" }],
      description: "Somente para o perfil analista.",
    },
    requester: {
      type: "object",
      properties: {
        area: { type: "string", maxLength: 100 },
        department: { type: "string", nullable: true, maxLength: 100 },
        manager: { type: "string", maxLength: 150 },
        additionalContact: { type: "string", nullable: true, maxLength: 100 },
      },
    },
  },
};

export const UpdateProfilePayload = {
  type: "object",
  additionalProperties: false,
  properties: {
    fullName: { type: "string", maxLength: 150 },
    requester: {
      type: "object",
      additionalProperties: false,
      properties: {
        area: { type: "string", maxLength: 100 },
        department: { type: "string", nullable: true, maxLength: 100 },
        manager: { type: "string", maxLength: 150 },
        additionalContact: { type: "string", nullable: true, maxLength: 100 },
      },
      description:
        "Somente `additionalContact` é autoeditável; área/departamento/gestor apenas pelo próprio Administrador.",
    },
    removeAvatar: { type: "boolean" },
  },
};

export const ChangeUserStatusRequest = {
  type: "object",
  required: ["isActive"],
  properties: {
    isActive: { type: "boolean", example: true },
  },
};

export const ChangeUserStatusResponse = {
  type: "object",
  required: ["id", "isActive"],
  properties: {
    id: { type: "string" },
    isActive: { type: "boolean" },
  },
};

export const ResetPasswordResponse = {
  type: "object",
  required: ["id", "temporaryPassword"],
  properties: {
    id: { type: "string" },
    temporaryPassword: { type: "string" },
  },
};
