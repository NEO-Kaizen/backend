const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
});

const validationErrorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
    },
  },
});

/** Códigos estáveis lançados nas recusas, no formato do envelope `ErrorResponse`. */
const formatErrorCodes = (...codes: readonly string[]) =>
  codes.map((code) => `\`${code}\``).join(", ");

/** Recusas de composição comuns à criação e à duplicação. */
const COMPOSITION_ERROR_CODES = [
  "profile_permission_unknown_key",
  "profile_permission_invalid_custody",
  "profile_permission_fixed_custody",
  "profile_permission_duplicate_key",
  "profile_permission_missing_dependency",
  "profile_flag_predicate_missing",
  "profile_permission_key_escalation",
  "profile_permission_custody_escalation",
] as const;

const CREATE_ERROR_CODES = [...COMPOSITION_ERROR_CODES, "profile_name_taken"] as const;

const UPDATE_ERROR_CODES = [
  ...CREATE_ERROR_CODES,
  "profile_work_key_flag_on",
  "profile_work_key_open_requests",
  "profile_root_requires_manage",
  "profile_root_not_assignable",
] as const;

const STATUS_ERROR_CODES = [
  "profile_has_users",
  "profile_root_not_deactivatable",
  "profile_name_taken",
] as const;

export default {
  "/profiles": {
    get: {
      tags: ["Perfis"],
      summary: "Listar perfis",
      description:
        "Lista os perfis ativos e inativos com a composição ordenada, as flags de Atribuibilidade, a marca `isRoot` (presente no próprio Perfil Admin Root) e a contagem de contas vinculadas.",
      operationId: "listProfiles",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Perfis cadastrados.",
          content: {
            "application/json": {
              schema: { type: "array", items: { $ref: "#/components/schemas/Profile" } },
            },
          },
        },
        "401": errorResponse("Sem sessão ou token inválido."),
        "403": errorResponse("Perfil sem a permissão profile:read."),
      },
    },
    post: {
      tags: ["Perfis"],
      summary: "Criar perfil customizado",
      description:
        "Cria um Perfil customizado com as guardas de composição: sem escalação de chave e de vínculo, dependências de chave, custódia fixa das chaves de posse e unicidade de nome (case-insensitive) entre perfis ativos.",
      operationId: "createProfile",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ProfileCreateRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Perfil criado.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Profile" } },
          },
        },
        "400": errorResponse(
          "Composição inválida (chave, vínculo, dependência ou escalação) ou nome já usado por " +
            `perfil ativo. Códigos: ${formatErrorCodes(...CREATE_ERROR_CODES)}.`,
        ),
        "401": errorResponse("Sem sessão ou token inválido."),
        "403": errorResponse("Perfil sem a permissão profile:manage."),
        "422": validationErrorResponse("Payload inválido."),
      },
    },
  },
  "/profiles/keys": {
    get: {
      tags: ["Perfis"],
      summary: "Catálogo de chaves do editor de perfis",
      description:
        "Devolve as 39 chaves na ordem de referência (tipo, vínculos permitidos, dependências) e os predicados de Atribuibilidade das flags.",
      operationId: "getProfileKeyCatalog",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Catálogo de chaves.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ProfileKeyCatalog" } },
          },
        },
        "401": errorResponse("Sem sessão ou token inválido."),
        "403": errorResponse("Perfil sem a permissão profile:read."),
      },
    },
  },
  "/profiles/{id}": {
    get: {
      tags: ["Perfis"],
      summary: "Detalhar perfil",
      description: "Detalha um Perfil com a composição na ordem do catálogo.",
      operationId: "getProfile",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "6" },
        },
      ],
      responses: {
        "200": {
          description: "Perfil.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Profile" } },
          },
        },
        "401": errorResponse("Sem sessão ou token inválido."),
        "403": errorResponse("Perfil sem a permissão profile:read."),
        "404": errorResponse("Perfil não encontrado."),
      },
    },
    patch: {
      tags: ["Perfis"],
      summary: "Editar perfil (parcial e atômico)",
      description:
        "Edita nome, descrição, flags e/ou composição. Campo ausente é intocado; `permissions` presente substitui integralmente. Remover chave de trabalho exige desligar a flag de Atribuibilidade correspondente na mesma chamada; com solicitações abertas atribuídas a usuários do perfil, a recusa lista os protocolos. O Perfil Admin Root só é editado pelo Admin Root, mantém `profile:manage` e não recebe flags.",
      operationId: "updateProfile",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "6" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ProfileUpdateRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Perfil atualizado.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Profile" } },
          },
        },
        "400": errorResponse(
          "Composição inválida, nome já usado por perfil ativo, remoção de chave de trabalho com " +
            "a flag de Atribuibilidade ligada, solicitações abertas atribuídas a usuários do " +
            "perfil, retirada de `profile:manage` do Perfil Admin Root ou flag no Perfil Admin " +
            `Root. Códigos: ${formatErrorCodes(...UPDATE_ERROR_CODES)}.`,
        ),
        "401": errorResponse("Sem sessão ou token inválido."),
        "403": errorResponse(
          "Perfil sem a permissão profile:manage ou ator que não é o Admin Root editando o " +
            "Perfil Admin Root (`profile_root_protected`).",
        ),
        "404": errorResponse("Perfil não encontrado."),
        "422": validationErrorResponse("Payload inválido ou sem nenhum campo para atualização."),
      },
    },
  },
  "/profiles/{id}/status": {
    patch: {
      tags: ["Perfis"],
      summary: "Ativar ou desativar perfil",
      description:
        "Desativação bloqueada quando há contas vinculadas (regra uniforme, base incluído). O Perfil Admin Root nunca é desativado. Exclusão física não existe.",
      operationId: "changeProfileStatus",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "6" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ProfileStatusRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Status alterado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProfileStatusResponse" },
            },
          },
        },
        "400": errorResponse(
          "Perfil com contas vinculadas, Perfil Admin Root ou nome em uso por outro perfil ativo. " +
            `Códigos: ${formatErrorCodes(...STATUS_ERROR_CODES)}.`,
        ),
        "401": errorResponse("Sem sessão ou token inválido."),
        "403": errorResponse("Perfil sem a permissão profile:manage."),
        "404": errorResponse("Perfil não encontrado."),
        "422": validationErrorResponse("Payload inválido."),
      },
    },
  },
  "/profiles/{id}/duplicate": {
    post: {
      tags: ["Perfis"],
      summary: "Duplicar perfil",
      description:
        "Cria um Perfil customizado a partir da composição e das flags de outro perfil (base ou customizado), com nome novo. Passa pelas mesmas validações da criação contra o conjunto do ator. Duplicar o Perfil Admin Root gera um custom comum.",
      operationId: "duplicateProfile",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "5" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ProfileDuplicateRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Perfil customizado criado.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Profile" } },
          },
        },
        "400": errorResponse(
          "Escalação de chave/vínculo, dependência, predicado de flag ou nome já usado por " +
            `perfil ativo. Códigos: ${formatErrorCodes(...CREATE_ERROR_CODES)}.`,
        ),
        "401": errorResponse("Sem sessão ou token inválido."),
        "403": errorResponse("Perfil sem a permissão profile:manage."),
        "404": errorResponse("Perfil de origem não encontrado."),
        "422": validationErrorResponse("Payload inválido."),
      },
    },
  },
};
