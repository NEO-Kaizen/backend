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
    put: {
      tags: ["Usuários"],
      summary: "Atualizar meu perfil",
      description:
        "Atualiza nome, dados do solicitante e/ou remove a foto do próprio usuário (self-service). Multipart: campo `payload` (JSON) + campo `avatar` (arquivo opcional, JPEG/PNG até 2MB). Área, departamento e gestor exigem a permissão `user:manage`.",
      operationId: "updateMyProfile",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["payload"],
              properties: {
                payload: {
                  type: "string",
                  description:
                    "JSON com os campos a atualizar: fullName, requester (área/departamento/gestor exigem `user:manage`) e removeAvatar.",
                  example: JSON.stringify({
                    fullName: "Maria Silva",
                    requester: { additionalContact: "contato@email.com" },
                    removeAvatar: false,
                  }),
                },
              },
            },
            encoding: {
              payload: { contentType: "application/json" },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Perfil atualizado com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserProfileResponse" },
            },
          },
        },
        "400": {
          description: "Payload inválido (parte `payload` ausente ou JSON malformado).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
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
          description:
            "Área, departamento e gestor exigem a permissão `user:manage` (403 `user_manage_required`).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "413": {
          description: "Arquivo de avatar excede 2 MB.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "415": {
          description:
            "Campo de arquivo inesperado ou MIME/extensão não permitida (apenas JPEG/PNG).",
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
      summary: "Listar Responsáveis atribuíveis",
      description:
        "Exige `assignee_directory:read`. Lista contas ativas com extensão profissional ativa cujo Perfil tem a flag de Atribuibilidade e todas as chaves de trabalho da etapa. Não depende do nome do Perfil. Use `stage=triage` (padrão) ou `stage=mapping`.",
      operationId: "listAssignableProfessionals",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: "query",
          name: "stage",
          required: false,
          schema: { type: "string", enum: ["triage", "mapping"], default: "triage" },
          description: "Etapa da Atribuibilidade usada para filtrar os profissionais.",
        },
      ],
      responses: {
        "200": {
          description: "Lista de profissionais atribuíveis.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/AssignableProfessional" },
              },
            },
          },
        },
        "400": {
          description: "Etapa inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
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
          description: "Sem `assignee_directory:read`.",
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
      description: "Retorna Métricas consolidadas de Usuários. Exige a permissão `user:read`.",
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
          description: "Sem a permissão exigida para a operação.",
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
      description: "Lista todos os Usuários cadastrados. Exige a permissão `user:read`.",
      operationId: "listUsers",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Lista de Usuários.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data", "page", "pageSize", "total", "totalPages"],
                properties: {
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/UserSummary" },
                  },
                  page: { type: "integer", example: 1 },
                  pageSize: { type: "integer", example: 10 },
                  total: { type: "integer", example: 25 },
                  totalPages: { type: "integer", example: 3 },
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
          description: "Sem a permissão exigida para a operação.",
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
      description:
        "Cadastra um novo usuário. Exige a permissão `user:manage`; a matriz de contas (§ 4.2) recusa Perfis de autoridade igual ou maior (403 `account_out_of_authority`), o Perfil Admin Root (403 `root_account_protected`) e Perfil inativo (409 `profile_inactive`).",
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
                role: { type: "string", example: "Coordenador" },
                requester: {
                  type: "object",
                  description: "Dados do solicitante — obrigatórios para todos os perfis.",
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
                    "Conteúdo opcional da Extensão de profissional. Só pode ser enviado para Perfil ativo com flag de Atribuibilidade; a extensão é criada automaticamente.",
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
                  role: "Analista",
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
                  role: "Solicitante",
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
              schema: { $ref: "#/components/schemas/CreateUserResponse" },
            },
          },
        },
        "400": {
          description:
            "Perfil inválido ou conteúdo da Extensão de profissional enviado para Perfil não atribuível (`professional_profile_not_assignable`).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "409": {
          description: "E-mail já cadastrado ou Perfil de destino inativo (`profile_inactive`).",
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
          description:
            "Sem `user:manage`, Perfil de destino de autoridade igual ou maior (`account_out_of_authority`) ou Perfil Admin Root (`root_account_protected`).",
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
      description: "Retorna os dados de um usuário pelo seu ID. Exige a permissão `user:read`.",
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
              schema: { $ref: "#/components/schemas/UserProfileResponse" },
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
          description: "Sem a permissão exigida para a operação.",
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
      description:
        "Atualiza os dados de um usuário pelo ID. Exige a permissão `user:manage`; a matriz de contas (§ 4.2) recusa a própria conta (403 `self_management_forbidden`), Admin Root (403 `root_account_protected`), conta de autoridade igual ou maior (403 `account_out_of_authority`) e Perfil inativo na designação (409 `profile_inactive`).",
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
                fullName: { type: "string" },
                role: { type: "string", example: "Coordenador" },
                requester: {
                  type: "object",
                  description: "Dados do solicitante (área, departamento e gestor).",
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
                },
                professional: {
                  type: "object",
                  description:
                    "Conteúdo da Extensão de profissional — permitido apenas para Perfis atribuíveis.",
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
              schema: { $ref: "#/components/schemas/UserProfileResponse" },
            },
          },
        },
        "400": {
          description:
            "Payload inválido ou conteúdo da Extensão de profissional enviado para Perfil não atribuível (`professional_profile_not_assignable`).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
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
          description:
            "Sem `user:manage`, autoedição (`self_management_forbidden`), conta Admin Root (`root_account_protected`) ou conta de autoridade igual ou maior (`account_out_of_authority`).",
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
        "409": {
          description:
            "E-mail já cadastrado, Perfil de destino inativo (`profile_inactive`) ou conta Responsável por solicitações abertas (`user_has_open_assignments`).",
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
      description:
        "Ativa ou desativa um usuário. Exige a permissão `user:manage`; recusa a própria conta (403 `self_management_forbidden`), Admin Root (403 `root_account_protected`) e conta de autoridade igual ou maior (403 `account_out_of_authority`).",
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
              schema: { $ref: "#/components/schemas/ChangeUserStatusResponse" },
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
          description:
            "Sem `user:manage`, autoedição (`self_management_forbidden`), conta Admin Root (`root_account_protected`) ou conta de autoridade igual ou maior (`account_out_of_authority`).",
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
      description:
        "Gera uma senha temporária para o usuário. Exige a permissão `user:manage`; recusa a própria conta (403 `self_management_forbidden`), Admin Root (403 `root_account_protected`) e conta de autoridade igual ou maior (403 `account_out_of_authority`).",
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
          description:
            "Sem `user:manage`, autoedição (`self_management_forbidden`), conta Admin Root (`root_account_protected`) ou conta de autoridade igual ou maior (`account_out_of_authority`).",
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
