import { error, json } from "../components/responses.ts";

const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "`users.user_id` como string.",
  schema: { type: "string", example: "101" },
};

export default {
  "/users/me": {
    get: {
      tags: ["Usuários"],
      summary: "Consultar meu perfil",
      description:
        "Retorna perfil completo do usuário autenticado: dados básicos, bloco requester, bloco professional (analista) e avatar.",
      operationId: "getMyProfile",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": { description: "Perfil do usuário.", ...json("UserProfileResponse") },
        "401": error("Sem sessão ou token inválido."),
        "404": error("Usuário do token não existe mais."),
      },
    },
    put: {
      tags: ["Usuários"],
      summary: "Atualizar meu perfil",
      description:
        "Self-service: atualiza `fullName`, `additionalContact`, bloco `requester` (UPSERT) e/ou avatar. Somente o próprio Administrador pode alterar área, departamento e gestor por esta rota. " +
        "Multipart: campo `payload` (JSON `UpdateProfilePayload`) + campo `avatar` opcional (JPEG/PNG até 2 MB). Enviar `avatar` e `removeAvatar: true` juntos é inválido.",
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
                  "x-payload-schema": { $ref: "#/components/schemas/UpdateProfilePayload" },
                  description: "JSON.stringify de `UpdateProfilePayload`.",
                  example: JSON.stringify({
                    fullName: "Maria Silva",
                    requester: { additionalContact: "contato@email.com" },
                    removeAvatar: false,
                  }),
                },
                avatar: { type: "string", format: "binary" },
              },
            },
            encoding: { payload: { contentType: "application/json" } },
          },
        },
      },
      responses: {
        "200": { description: "Perfil atualizado.", ...json("UserProfileResponse") },
        "400": error(
          "Payload inválido, parte ausente, JSON malformado, `removeAvatar` + `avatar` juntos, campo de arquivo inesperado ou limite de quantidade.",
        ),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Tentativa de alterar área/departamento/gestor sem ser Administrador."),
        "413": error("Avatar acima de 2 MB."),
        "415": error("MIME/extensão não permitida (apenas JPEG/PNG)."),
        "404": error("Usuário do token não existe mais."),
      },
    },
  },

  "/users/analysts": {
    get: {
      tags: ["Usuários"],
      summary: "Listar profissionais atribuíveis",
      description:
        "Diretório de Responsáveis por etapa: Perfil ativo com flag de Atribuibilidade e o predicado de chaves da etapa. Sem paginação. Exige `assignee_directory:read`.",
      operationId: "listAssignableProfessionals",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "query",
          required: false,
          description:
            "Quando presente, omite o criador da solicitação e responde `404 request_not_found` se o protocolo não existir.",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Lista direta de profissionais atribuíveis.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/AssignableProfessional" },
              },
            },
          },
        },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sem `assignee_directory:read`."),
        "404": error("Protocolo informado não existe (`request_not_found`)."),
      },
    },
  },

  "/users/metrics": {
    get: {
      tags: ["Usuários"],
      summary: "Métricas de usuários",
      description:
        "Contagens consolidadas da base de usuários: total, ativos, com troca de senha pendente e administradores.",
      operationId: "getUserMetrics",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": { description: "Métricas de usuários.", ...json("UserMetrics") },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
  },

  "/users": {
    get: {
      tags: ["Usuários"],
      summary: "Listar usuários",
      description: "Lista paginada de usuários cadastrados. Exige perfil Administrador.",
      operationId: "listUsers",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "profileId",
          in: "query",
          required: false,
          description: "Identidade estável do Perfil (`profiles.profile_id`).",
          schema: { type: "string", example: "2" },
        },
        {
          name: "search",
          in: "query",
          required: false,
          description: "Busca por nome ou e-mail.",
          schema: { type: "string", maxLength: 150 },
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "pageSize",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        },
      ],
      responses: {
        "200": { description: "Página de usuários.", ...json("UserListResponse") },
        "400": error("Query inválida."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
    post: {
      tags: ["Usuários"],
      summary: "Criar usuário",
      description:
        "Cadastra um usuário e sua extensão de solicitante na mesma transação. `professional` é obrigatório para o perfil analista e proibido nos demais. Retorna a senha temporária uma única vez.",
      operationId: "createUser",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateUserRequest" },
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
        "201": { description: "Usuário criado.", ...json("CreateUserResponse") },
        "400": error("Perfil inválido ou dados profissionais obrigatórios/exclusivos do analista."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
        "409": error("E-mail já cadastrado."),
        "422": error("Erro de validação com `fields`.", "ValidationErrorResponse"),
      },
    },
  },

  "/users/{id}": {
    get: {
      tags: ["Usuários"],
      summary: "Consultar usuário por ID",
      description: "Retorna o perfil completo de um usuário. Exige perfil Administrador.",
      operationId: "getUser",
      security: [{ cookieAuth: [] }],
      parameters: [idParam],
      responses: {
        "200": { description: "Perfil do usuário.", ...json("UserProfileResponse") },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
        "404": error("Usuário não encontrado."),
      },
    },
    put: {
      tags: ["Usuários"],
      summary: "Atualizar usuário",
      description:
        "Edição administrativa parcial (merge): `fullName`, `email`, `role`, `professional` e `requester`. Contas de Administrador só podem ter o bloco `requester` alterado.",
      operationId: "updateUser",
      security: [{ cookieAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Usuário atualizado.", ...json("UserProfileResponse") },
        "400": error("Payload inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso ou tentativa de gerenciar Administrador."),
        "404": error("Usuário não encontrado."),
        "409": error("E-mail já cadastrado."),
        "422": error("Erro de validação com `fields`.", "ValidationErrorResponse"),
      },
    },
  },

  "/users/{id}/status": {
    patch: {
      tags: ["Usuários"],
      summary: "Alterar status do usuário",
      description: "Ativa ou desativa uma conta. Exige perfil Administrador.",
      operationId: "changeUserStatus",
      security: [{ cookieAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ChangeUserStatusRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Status alterado.", ...json("ChangeUserStatusResponse") },
        "400": error("Payload inválido ou tentativa de alterar a própria conta."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso ou conta de Administrador."),
        "404": error("Usuário não encontrado."),
      },
    },
  },

  "/users/{id}/reset-password": {
    post: {
      tags: ["Usuários"],
      summary: "Redefinir senha do usuário",
      description:
        "Gera uma senha temporária e marca a troca como obrigatória. Exige perfil Administrador.",
      operationId: "resetUserPassword",
      security: [{ cookieAuth: [] }],
      parameters: [idParam],
      responses: {
        "200": { description: "Senha redefinida.", ...json("ResetPasswordResponse") },
        "400": error("Tentativa de redefinir a própria senha."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso ou conta de Administrador."),
        "404": error("Usuário não encontrado."),
      },
    },
  },
};
