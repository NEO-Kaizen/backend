import { protocolParam } from "../components/parameters.ts";
import { error, json } from "../components/responses.ts";

export default {
  "/requests": {
    get: {
      tags: ["Solicitações"],
      summary: "Listar solicitações por e-mail",
      description:
        "Lista paginada das solicitações vinculadas a um e-mail de solicitante, da mais recente para a mais antiga. " +
        "No modo `PUBLIC` o e-mail vem da query (obrigatório); com sessão, exige `request:track` em `own`, a sessão define o e-mail e `?email=` é recusado com 400.",
      operationId: "getRequestsByEmail",
      security: [{}, { cookieAuth: [] }],
      parameters: [
        {
          name: "email",
          in: "query",
          required: false,
          description: "E-mail do solicitante (apenas no modo PUBLIC).",
          schema: { type: "string", format: "email", example: "maria.silva@empresa.com" },
        },
        {
          name: "status",
          in: "query",
          required: false,
          description: "Nome exato de um status válido.",
          schema: { type: "string", example: "Em triagem" },
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
          description: "Itens por página (1 a 10).",
          schema: { type: "integer", minimum: 1, maximum: 10, default: 10 },
        },
      ],
      responses: {
        "200": { description: "Página de solicitações.", ...json("PaginatedRequestSummary") },
        "400": error("Query `email` ausente/inválida ou status inexistente."),
        "401": error("Modo AUTHENTICATED sem sessão válida."),
        "403": error("Sessão sem `request:track` em `own`."),
      },
    },
    post: {
      tags: ["Solicitações"],
      summary: "Criar solicitação",
      description:
        "Cadastra uma nova solicitação, gera o protocolo e persiste os blocos do formulário. " +
        "Público no modo `PUBLIC`; com sessão, exige `request:create` e a identidade vem do cadastro do usuário logado.",
      operationId: "postRequest",
      security: [{}, { cookieAuth: [] }],
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
                  "x-payload-schema": { $ref: "#/components/schemas/CreateRequestPayload" },
                  description:
                    "JSON.stringify de `CreateRequestPayload` (requester, demand, operational, complementary?, schedulePreferences?).",
                  example: JSON.stringify({
                    requester: {
                      fullName: "Maria Silva",
                      corporateEmail: "maria.silva@empresa.com",
                      area: "TI",
                      department: "Desenvolvimento",
                      manager: "José Silva",
                      additionalContact: "",
                    },
                    demand: {
                      title: "Automatizar conciliação bancária",
                      requestType: "Automação",
                      category: "Automação",
                      processName: "Conciliação bancária mensal",
                      description: "Descrição da necessidade.",
                      problem: "Problema ou oportunidade.",
                      expectedResult: "Resultado esperado.",
                      justification: "Justificativa.",
                    },
                    operational: {
                      processDescription: "Descrição resumida.",
                      processSteps: "1. Receber; 2. Conferir.",
                      systemsUsed: "Excel",
                      executionFrequency: "Mensal",
                      volumetry: "500 transações/mês",
                      peopleInvolved: 2,
                      averageExecutionTime: "15 minutos",
                      monthlyEffortHours: 16,
                      hasManualControls: false,
                      mainRisks: "Risco de divergência.",
                      clientImpact: "Impacto no cliente interno.",
                      operationalImpact: "Médio",
                      desiredDeadline: "2026-12-31",
                      perceivedCriticality: "Média",
                    },
                    schedulePreferences: ["2026-09-15T13:30"],
                  }),
                },
                attachments: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  maxItems: 5,
                  description: "0 a 5 arquivos (10 MB cada): PDF, DOCX, XLSX, PNG ou JPG.",
                },
              },
            },
            encoding: { payload: { contentType: "application/json" } },
          },
        },
      },
      responses: {
        "201": { description: "Solicitação criada.", ...json("CreateRequestResponse") },
        "400": error(
          "Payload inválido, anexo acima de 10 MB, formato não permitido ou mais de 5 anexos.",
        ),
        "401": error("Modo AUTHENTICATED sem sessão válida."),
      },
    },
  },

  "/requests/assignees": {
    get: {
      tags: ["Solicitações"],
      summary: "Listar responsáveis atribuíveis",
      description:
        "Lista os Responsáveis atribuíveis (extensão profissional ativa, conta e Perfil ativos, flag de Atribuibilidade ligada e chaves exigidas pela etapa). Exige `assignee_directory:read`.",
      operationId: "getAssignees",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Responsáveis atribuíveis, ordenados por nome.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/AssigneeSummary" },
              },
            },
          },
        },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Ator sem `assignee_directory:read`."),
      },
    },
  },

  "/requests/{protocol}": {
    get: {
      tags: ["Solicitações"],
      summary: "Consultar solicitação pelo protocolo",
      description:
        "Consulta pública (`PUBLIC`) ou autenticada: com sessão, exige `request:track` em `own` e responde 404 para solicitação de terceiro, sem revelar a existência.",
      operationId: "getRequestsByProtocol",
      security: [{}, { cookieAuth: [] }],
      parameters: [protocolParam],
      responses: {
        "200": { description: "Detalhe público da solicitação.", ...json("PublicRequestDetail") },
        "400": error("Protocolo inválido."),
        "401": error("Modo AUTHENTICATED sem sessão válida."),
        "403": error("Sessão sem `request:track`."),
        "404": error("Protocolo não encontrado ou fora da Posse do ator."),
      },
    },
  },

  "/requests/{protocol}/internal": {
    get: {
      tags: ["Solicitações"],
      summary: "Consulta administrativa de solicitação",
      description:
        "Retorna os blocos completos, status, priorização, responsáveis, anexos, pendências e estado de leitura. " +
        "Exige `request:read`: `assigned` lê apenas solicitações sob o Responsável corrente; `all` lê qualquer uma. Linha fora da Custódia responde 404.",
      operationId: "getInternalRequestByProtocol",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      responses: {
        "200": { description: "Detalhe interno da solicitação.", ...json("InternalRequestDetail") },
        "401": error("Sem cookie ou token inválido/expirado."),
        "403": error("Sessão sem `request:read`."),
        "404": error("Protocolo inexistente ou fora da Custódia do ator."),
      },
    },
    patch: {
      tags: ["Solicitações"],
      summary: "Atualização interna de solicitação",
      description:
        "Substitui os blocos editáveis (`requester`, `demand`, `operational`, `complementary`). " +
        "Chave ausente = campo limpo (NULL). Exige `request:write` sob Custódia; sem `request:read` sobre a linha, a resposta é apenas `{ protocol, updated: true }`.",
      operationId: "patchInternalRequestByProtocol",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateInternalRequestPayload" },
          },
        },
      },
      responses: {
        "200": {
          description: "Solicitação atualizada (ou acknowledgement sem conteúdo interno).",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/InternalRequestDetail" },
                  { $ref: "#/components/schemas/RequestMutationAcknowledgement" },
                ],
              },
            },
          },
        },
        "400": error("Payload inválido."),
        "401": error("Sem cookie de sessão."),
        "403": error("Sessão sem `request:write`."),
        "404": error("Protocolo inexistente ou fora da Custódia do ator."),
        "422": error("Erro de validação com `fields`.", "ValidationErrorResponse"),
      },
    },
  },

  "/requests/{protocol}/triage": {
    get: {
      tags: ["Triagem"],
      summary: "Consultar triagem da solicitação",
      description:
        "Retorna a triagem vigente (a última criada) ou `null` se ainda não houver. Gestor tem leitura; Analista só acessa as atribuídas.",
      operationId: "getTriage",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      responses: {
        "200": {
          description: "Triagem vigente (ou null).",
          content: {
            "application/json": {
              schema: {
                type: "object",
                allOf: [{ $ref: "#/components/schemas/TriagemResponse" }],
                nullable: true,
              },
            },
          },
        },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Usuário sem acesso à solicitação."),
        "404": error("Protocolo inexistente."),
      },
    },
    post: {
      tags: ["Triagem"],
      summary: "Criar triagem da solicitação",
      description:
        "Cria uma nova triagem (append — cada chamada gera um novo registro). A troca de categoria e a transição de status acontecem na mesma transação. " +
        "Perfis: Administrador ou Analista responsável; Gestor é somente leitura.",
      operationId: "saveTriage",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateTriagePayload" },
          },
        },
      },
      responses: {
        "201": { description: "Triagem criada.", ...json("TriagemResponse") },
        "400": error("Payload inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil ou custódia insuficiente."),
        "404": error("Protocolo inexistente."),
        "409": error("Conflito de estado (ex.: transição concorrente)."),
        "422": error("Erro de validação da triagem; pode conter `fields`."),
      },
    },
  },

  "/requests/{protocol}/tracking": {
    get: {
      tags: ["Solicitações"],
      summary: "Acompanhamento do solicitante",
      description:
        "Acompanhamento bimodal. Com sessão, exige `request:track` em `own` e a Posse sobre a linha → `mode: authenticated`; identidade pública (protocolo + nome + e-mail) via `X-Requester-Identity` → `mode: public`. " +
        "O recorte nunca inclui triagem, priorização ou notas internas.",
      operationId: "getTracking",
      security: [{ cookieAuth: [] }, { requesterIdentity: [] }],
      parameters: [
        protocolParam,
        {
          name: "X-Requester-Identity",
          in: "header",
          required: false,
          description:
            'JSON `{"name":"...","email":"..."}` verificado previamente em `POST .../public/verify`.',
          schema: { type: "string" },
          example: '{"name":"Maria Silva","email":"maria.silva@empresa.com"}',
        },
      ],
      responses: {
        "200": { description: "Detalhe de acompanhamento.", ...json("TrackingResponse") },
        "401": error("Identidade ausente/divergente ou sessão inválida."),
        "403": error(
          "Sessão sem `request:track` ou verificação indisponível no modo AUTHENTICATED.",
        ),
        "404": error("Protocolo não encontrado ou fora da Posse do ator."),
      },
    },
  },

  "/requests/{protocol}/status": {
    patch: {
      tags: ["Solicitações"],
      summary: "Trocar status da solicitação",
      description:
        "Troca única de status (Motor de Status v4). Exige `request:status_change` sob Custódia; alvos restritos ou fora do modo `free` da etapa exigem `request:status_override` global. " +
        "Toda transição exige `justification`; destino público exige `lastTechnicalMessage` — o override não dispensa os campos. Status igual ao atual → 422; status inativo → 409; solicitação fora da Custódia → 404.",
      operationId: "patchRequestStatus",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateStatusPayload" },
          },
        },
      },
      responses: {
        "200": { description: "Status alterado.", ...json("UpdateStatusResponse") },
        "400": error("Payload inválido ou retorno público ausente."),
        "401": error("Sem sessão ou token inválido."),
        "403": error(
          "Sessão sem `request:status_change` ou sem `request:status_override` para o alvo.",
        ),
        "404": error("Protocolo fora da Custódia ou status de destino inexistente."),
        "409": error("Status de destino inativo ou conflito de concorrência."),
        "422": error("Status de destino igual ao atual ou erro de estado."),
      },
    },
  },

  "/requests/{protocol}/internal/assignee": {
    patch: {
      tags: ["Solicitações"],
      summary: "Atribuir responsável interno",
      description:
        "Define/remove o responsável de triagem (`assigneeId`) ou o designado do mapeamento (`mappingAssigneeId`) — exatamente um por chamada. " +
        "Nesta rota ambos são `users.user_id` numérico em string. Exige `request:assign` sob Custódia; alvo inválido responde 400 `assignee_not_assignable`; sem `request:read` sobre a linha, a resposta é apenas `{ protocol, updated: true }`.",
      operationId: "patchInternalAssignee",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AssignAnalystPayload" },
          },
        },
      },
      responses: {
        "200": {
          description: "Responsável atualizado (ou acknowledgement sem conteúdo interno).",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/InternalRequestDetail" },
                  { $ref: "#/components/schemas/RequestMutationAcknowledgement" },
                ],
              },
            },
          },
        },
        "400": error(
          "Payload inválido (não informou exatamente um dos campos), responsável inativo ou perfil não atribuível (`assignee_not_assignable`).",
        ),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem `request:assign`."),
        "404": error("Protocolo inexistente ou fora da Custódia do ator."),
      },
    },
  },

  "/requests/{protocol}/assignee": {
    patch: {
      tags: ["Solicitações"],
      summary: "Atribuir Responsável (legado)",
      description:
        "Rota legada de atribuição por `professionalId` (UUID de `details_professional`). Exige `request:assign` sob Custódia. Use `PATCH /requests/{protocol}/internal/assignee`. " +
        "⚠ O schema atual aceita `{}` e remove o responsável silenciosamente.",
      operationId: "patchAssignee",
      deprecated: true,
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AssignRequestPayload" },
          },
        },
      },
      responses: {
        "200": { description: "Responsável atribuído.", ...json("AssignRequestResponse") },
        "400": error(
          "UUID inválido, profissional inexistente, inativo ou com perfil não atribuível.",
        ),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem `request:assign`."),
        "404": error("Protocolo inexistente ou fora da Custódia do ator."),
      },
    },
  },
};
