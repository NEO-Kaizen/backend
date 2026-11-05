export default {
  "/auth/login": {
    post: {
      tags: ["Autenticação"],
      summary: "Autenticar usuário",
      description:
        "Autentica o usuário com e-mail e senha. Em caso de sucesso, define um cookie de sessão " +
        "HttpOnly com o token JWT e retorna os dados do usuário (sem a senha).",
      operationId: "authLogin",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Login realizado com sucesso. Cookie `session_id` definido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginResponse" },
            },
          },
        },
        "400": {
          description: "E-mail ou senha ausentes.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Credenciais inválidas.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: ["Autenticação"],
      summary: "Encerrar sessão",
      description:
        "Remove o cookie de sessão do navegador. Idempotente — retorna sucesso mesmo sem sessão ativa.",
      operationId: "authLogout",
      responses: {
        "200": {
          description: "sessão encerrada com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogoutResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/me": {
    get: {
      tags: ["Autenticação"],
      summary: "Consultar sessão atual",
      description:
        "Retorna os dados do usuário da sessão atual a partir do cookie HttpOnly. " +
        "Valida o JWT e revalida usuário e perfil no banco a cada chamada.",
      operationId: "authMe",
      responses: {
        "200": {
          description: "Dados da sessão atual.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthenticatedUser" },
            },
          },
        },
        "401": {
          description: "Sem cookie ou sessão inválida/expirada/inativa.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/auth/change-password": {
    put: {
      tags: ["Autenticação"],
      summary: "Trocar senha",
      description:
        "Altera a senha do usuário autenticado. Requer cookie de sessão valido. " +
        "O usuário deve informar a senha atual e a nova senha (confirmada).",
      operationId: "authChangePassword",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Senha alterada com sucesso. Novo cookie de sessão definido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordResponse" },
            },
          },
        },
        "400": {
          description: "Payload inválido (senhas não conferem ou igual à atual).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
        "401": {
          description: "Sem cookie ou sessão inválida/expirada.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
};
