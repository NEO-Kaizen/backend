export const AuthenticatedUser = {
  type: "object",
  required: ["id", "name", "email", "avatarUrl", "role", "mustChangePassword"],
  properties: {
    id: { type: "string", example: "101" },
    name: { type: "string", example: "Administrador Teste" },
    email: { type: "string", format: "email", example: "administrador_teste@email.com" },
    avatarUrl: { type: "string", nullable: true, example: "/uploads/avatars/101-foto.jpg" },
    role: {
      type: "string",
      enum: ["Solicitante", "Analista", "Gestor", "Administrador"],
      example: "Administrador",
    },
    mustChangePassword: { type: "boolean", example: false },
  },
};

export const LoginRequest = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", example: "administrador_teste@email.com" },
    password: { type: "string", format: "password", example: "steste123" },
  },
};

export const LoginResponse = {
  $ref: "#/components/schemas/AuthenticatedUser",
};

export const LogoutResponse = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string", example: "Sessão encerrada com sucesso" },
  },
};

export const ChangePasswordRequest = {
  type: "object",
  required: ["currentPassword", "newPassword", "confirmNewPassword"],
  additionalProperties: false,
  properties: {
    currentPassword: { type: "string", format: "password" },
    newPassword: { type: "string", format: "password" },
    confirmNewPassword: { type: "string", format: "password" },
  },
};

export const ChangePasswordResponse = {
  $ref: "#/components/schemas/AuthenticatedUser",
};
