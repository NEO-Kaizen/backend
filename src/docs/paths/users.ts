export default {
  "/users/me": {
    get: {
      tags: ["Usuários"],
      summary: "Consultar meu perfil",
      description:
        "Retorna os dados do usuário autenticado (self-service, qualquer perfil interno).",
      operationId: "getMyProfile",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Dados do perfil do usuário.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthenticatedUser" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/users/analysts": {
    get: {
      tags: ["Usuários"],
      summary: "Listar analistas",
      description:
        "Lista profissionais com perfil `Analista` ativos, sem paginação. Usado no modal de atribuição de triagem.",
      operationId: "listAnalysts",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Lista de analistas.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/UserListItem" },
              },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/users/metrics": {
    get: {
      tags: ["Usuários"],
      summary: "Métricas de Usuários",
      description:
        "Retorna Métricas consolidadas de Usuários. Exige autenticação e perfil `Administrador`.",
      operationId: "getUserMetrics",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Métricas de Usuários.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserMetrics" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/users": {
    get: {
      tags: ["Usuários"],
      summary: "Listar Usuários",
      description: "Lista todos os Usuários cadastrados. Exige perfil `Administrador`.",
      operationId: "listUsers",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Lista de Usuários.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/UserListItem" },
              },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Usuários"],
      summary: "Criar usuário",
      description: "Cadastra um novo usuário. Exige perfil `Administrador`.",
      operationId: "createUser",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["fullName", "email", "role", "requester"],
              properties: {
                fullName: { type: "string", example: "Maria Silva" },
                email: { type: "string", format: "email", example: "novo@email.com" },
                role: {
                  type: "string",
                  enum: ["solicitante", "analista", "gestor", "administrador"],
                  example: "analista",
                },
                requester: {
                  type: "object",
                  description:
                    "Dados do solicitante — obrigatórios para todos os perfis.",
                  properties: {
                    area: { type: "string", example: "TI" },
                    department: { type: "string", example: "Desenvolvimento" },
                    manager: { type: "string", example: "José Silva" },
                    additionalContact: {
                      type: "string",
                      nullable: true,
                      example: "",
                    },
                  },
                  required: ["area", "manager"],
                },
                professional: {
                  type: "object",
                  description:
                    "Dados profissionais — obrigatório apenas quando o perfil é `analista`.",
                  properties: {
                    jobTitle: { type: "string", example: "Analista de Sistemas" },
                    specialties: {
                      type: "array",
                      items: { type: "string" },
                      example: ["Sistemas", "Automação"],
                    },
                    attendedCategoryIds: {
                      type: "array",
                      items: { type: "integer" },
                      example: [1, 2],
                    },
                    notes: { type: "string", nullable: true, example: "Analista sênior" },
                  },
                  required: ["jobTitle", "specialties", "attendedCategoryIds"],
                },
              },
            },
            examples: {
              analista: {
                summary: "Criar usuário analista",
                value: {
                  fullName: "Maria Silva",
                  email: "maria.silva@empresa.com",
                  role: "analista",
                  requester: {
                    area: "TI",
                    department: "Desenvolvimento",
                    manager: "José Silva",
                    additionalContact: "",
                  },
                  professional: {
                    jobTitle: "Analista de Sistemas",
                    specialties: ["Sistemas", "Automação"],
                    attendedCategoryIds: [1, 2],
                    notes: "Analista sênior",
                  },
                },
              },
              solicitante: {
                summary: "Criar usuário solicitante",
                value: {
                  fullName: "Carlos Souza",
                  email: "carlos.souza@empresa.com",
                  role: "solicitante",
                  requester: {
                    area: "Administrativo",
                    manager: "Ana Paula",
                    additionalContact: "",
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Usuário criado com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserListItem" },
            },
          },
        },
        "400": {
          description:
            "Perfil inválido ou dados profissionais obrigatórios/exclusivos do analista.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "409": {
          description: "E-mail já cadastrado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "422": {
          description: "Erro de validação com erros por campo (`fields`).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/users/{id}": {
    get: {
      tags: ["Usuários"],
      summary: "Consultar usuário por ID",
      description: "Retorna os dados de um usuário pelo seu ID. Exige perfil `Administrador`.",
      operationId: "getUser",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "101" },
        },
      ],
      responses: {
        "200": {
          description: "Dados do usuário.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserListItem" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Usuário não encontrado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Usuários"],
      summary: "Atualizar usuário",
      description: "Atualiza os dados de um usuário pelo ID. Exige perfil `Administrador`.",
      operationId: "updateUser",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "101" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                name: { type: "string" },
                role: {
                  type: "string",
                  enum: ["solicitante", "analista", "gestor", "administrador"],
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Usuário atualizado com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserListItem" },
            },
          },
        },
        "400": {
          description: "Payload inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Usuário não encontrado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/users/{id}/status": {
    patch: {
      tags: ["Usuários"],
      summary: "Alterar status do usuário",
      description: "Ativa ou desativa um usuário. Exige perfil `Administrador`.",
      operationId: "changeUserStatus",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "101" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["isActive"],
              properties: {
                isActive: { type: "boolean", example: true },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Status do usuário alterado com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserListItem" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Usuário não encontrado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/users/{id}/reset-password": {
    post: {
      tags: ["Usuários"],
      summary: "Redefinir senha do usuário",
      description: "Gera uma senha temporária para o usuário. Exige perfil `Administrador`.",
      operationId: "resetUserPassword",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "101" },
        },
      ],
      responses: {
        "200": {
          description: "Senha redefinida com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Senha redefinida com sucesso" },
                  temporaryPassword: { type: "string", example: "tmp-abc123" },
                },
              },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso (apenas Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "usuário não encontrado.",
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
