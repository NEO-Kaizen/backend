/**
 * Referência de Perfil na sessão: a identidade e o rótulo de
 * `ProfileReference` somados à marca estável `isRoot`.
 *
 * `isRoot` é a única fonte de identidade do Perfil Admin Root; não derive
 * autoridade de `name`, que é editável.
 */
export const SessionProfileReference = {
  description: "Perfil da sessão, com a marca estável do Admin Root.",
  allOf: [{ $ref: "#/components/schemas/ProfileReference" }],
  type: "object",
  required: ["id", "name", "isRoot"],
  properties: {
    isRoot: {
      type: "boolean",
      example: false,
      description: "`true` apenas quando a conta pertence ao Perfil Admin Root.",
    },
  },
};

export const AuthenticatedUser = {
  type: "object",
  required: ["id", "email", "name", "profile", "mustChangePassword"],
  properties: {
    id: { type: "string", example: "101" },
    email: { type: "string", example: "administrador_teste@email.com" },
    name: { type: "string", example: "administrador" },
    avatarUrl: { type: "string", nullable: true, example: "/uploads/avatars/101-foto.jpg" },
    profile: { $ref: "#/components/schemas/SessionProfileReference" },
    mustChangePassword: { type: "boolean", example: false },
  },
};

export const LoginRequest = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email", example: "administrador_teste@email.com" },
    password: { type: "string", format: "password", example: "steste123" },
  },
};

export const LoginResponse = {
  type: "object",
  allOf: [
    { $ref: "#/components/schemas/AuthenticatedUser" },
    {
      type: "object",
      properties: {
        // cookie definido automaticamente pelo servidor (HttpOnly)
      },
    },
  ],
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
  properties: {
    currentPassword: { type: "string", format: "password" },
    newPassword: { type: "string", format: "password" },
    confirmNewPassword: { type: "string", format: "password" },
  },
};

export const ChangePasswordResponse = {
  type: "object",
  allOf: [{ $ref: "#/components/schemas/AuthenticatedUser" }],
};
