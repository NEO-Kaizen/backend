import { protocolParam } from "../components/parameters.ts";
import { error, json } from "../components/responses.ts";

export default {
  "/requests": {
    get: {
      tags: ["Solicitações"],
      summary: "Listar solicitações por e-mail",
      description:
        "Lista paginada das solicitações vinculadas a um e-mail de solicitante, da mais recente para a mais antiga. " +
        "No modo `PUBLIC` o e-mail vem da query (obrigatório); no modo `AUTHENTICATED` a sessão define o e-mail e `?email=` é recusado com 400.",
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
      },
    },
    post: {
      tags: ["Solicitações"],
      summary: "Criar solicitação",
      description:
        "Cadastra uma nova solicitação, gera o protocolo e persiste os blocos do formulário. " +
        "Público no modo `PUBLIC`; no modo `AUTHENTICATED` exige sessão e a identidade vem do usuário logado.",
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
        "Lista os Responsáveis atribuíveis (profissional ativo, usuário ativo e perfil analista). Leitura liberada aos perfis internos.",
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
        "403": error("Sem `assignee_directory:read`."),
      },
    },
  },

  "/requests/{protocol}": {
    get: {
      tags: ["Solicitações"],
      summary: "Consultar solicitação pelo protocolo",
      description:
        "Consulta pública (`PUBLIC`) ou autenticada (`AUTHENTICATED`, restrita às solicitações do usuário logado).",
      operationId: "getRequestsByProtocol",
      security: [{}, { cookieAuth: [] }],
      parameters: [protocolParam],
      responses: {
        "200": { description: "Detalhe público da solicitação.", ...json("PublicRequestDetail") },
        "400": error("Protocolo inválido."),
        "401": error("Modo AUTHENTICATED sem sessão válida."),
        "404": error("Protocolo não encontrado ou de terceiro (anti-enumeração)."),
      },
    },
  },

  "/requests/{protocol}/internal": {
    get: {
      tags: ["Solicitações"],
      summary: "Consulta administrativa de solicitação",
      description:
        "Retorna os blocos completos, status, priorização, responsáveis, anexos, pendências e estado de leitura. " +
        "Exige `request:read` + Custódia do Responsável da triagem ou do Designado do mapeamento corrente. " +
        "Sem `internal_note:read` na linha, `internalObservations` vem `null`; sem `pending_item:read`, " +
        "`pendingSummary`/`unread` vêm zerados e `correctionAlert` vem `null`.",
      operationId: "getInternalRequestByProtocol",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      responses: {
        "200": { description: "Detalhe interno da solicitação.", ...json("InternalRequestDetail") },
        "401": error("Sem cookie ou token inválido/expirado."),
        "403": error("Sem `request:read` ou Custódia da linha."),
        "404": error("Protocolo inexistente ou fora da Custódia (`request_not_found`)."),
      },
    },
    patch: {
      tags: ["Solicitações"],
      summary: "Atualização interna de solicitação",
      description:
        "Substitui os blocos editáveis (`requester`, `demand`, `operational`, `complementary`). " +
        "Chave ausente = campo limpo (NULL). Exige `request:write` + Custódia do Responsável da triagem ou do mapeamento corrente; quem escreve sem `request:read` recebe `200 { protocol, updated: true }` em vez do detalhe.",
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
          description: "Solicitação atualizada (detalhe) ou acknowledgement sem `request:read`.",
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
        "403": error("Sem `request:write`."),
        "404": error("Protocolo inexistente ou fora da Custódia (`request_not_found`)."),
        "422": error("Erro de validação com `fields`.", "ValidationErrorResponse"),
      },
    },
  },

  "/requests/{protocol}/triage": {
    get: {
      tags: ["Triagem"],
      summary: "Consultar triagem da solicitação",
      description:
        "Retorna a triagem vigente (a última criada) ou `null` se ainda não houver. Exige `triage:read` + Custódia; fora dela responde `403`.",
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
        "403": error("Sem `triage:read` ou Custódia da linha."),
        "404": error("Protocolo inexistente (`request_not_found`)."),
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
        "403": error("Sem `triage:write` ou Custódia da linha."),
        "404": error("Protocolo inexistente (`request_not_found`)."),
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
        "Acompanhamento bimodal. Cookie de sessão do Solicitante → `mode: authenticated`; identidade pública (protocolo + nome + e-mail) via `X-Requester-Identity` → `mode: public`. " +
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
          "Perfil interno (sessão com `request:track` deve usar a porta interna) ou verificação indisponível no modo AUTHENTICATED.",
        ),
        "404": error("Protocolo não encontrado ou de terceiro (anti-enumeração)."),
      },
    },
  },

  "/requests/{protocol}/cancel": {
    post: {
      tags: ["Solicitações"],
      summary: "Cancelar solicitação antes da triagem",
      description:
        "Disponível ao solicitante autenticado com vínculo direto, no estado Solicitação enviada e sem avaliação registrada.",
      operationId: "postCancelRequest",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          ...protocolParam,
          description:
            "Protocolo de rastreio. Deve conter ao menos um caractere que não seja espaço em branco.",
          schema: { ...protocolParam.schema, pattern: "\\S" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/CancelRequestPayload" } },
        },
      },
      responses: {
        "200": { description: "Solicitação cancelada.", ...json("CancelRequestResponse") },
        "400": error("Protocolo vazio ou composto apenas por espaços em branco."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem permissão para cancelar."),
        "404": error("Protocolo não encontrado para o titular autenticado."),
        "409": error("Conflito com outra alteração da solicitação."),
        "422": error("Justificativa inválida ou solicitação inelegível (rf07_not_eligible)."),
      },
    },
  },

  "/requests/{protocol}/status": {
    patch: {
      tags: ["Solicitações"],
      summary: "Trocar status da solicitação",
      description:
        "Troca única de status (Motor de Status v4). Administrador tem bypass de perfil/restrição; o responsável com custódia só transita para status com `triageMode = free` ou `mappingMode = free` e nunca restrito. " +
        "Toda transição exige `justification`; destino público exige `lastTechnicalMessage`. Status igual ao atual → 422; status inativo → 409; Gestor é somente leitura.",
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
          "Sem `request:status_change`; alvo restrito ou fora do modo `free` exige `request:status_override` global (`request_status_override_required`).",
        ),
        "404": error("Protocolo inexistente, fora da Custódia ou status de destino inexistente."),
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
        "Nesta rota ambos são `users.user_id` numérico em string. Liberado ao Administrador ou ao Analista responsável pela solicitação; Gestor não atribui.",
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
        "200": { description: "Responsável atualizado.", ...json("InternalRequestDetail") },
        "400": error(
          "Payload inválido (não informou exatamente um dos campos), responsável inativo ou perfil não atribuível.",
        ),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sem `request:assign`."),
        "404": error("Protocolo inexistente ou fora da Custódia (`request_not_found`)."),
      },
    },
  },

  "/requests/{protocol}/assignee": {
    patch: {
      tags: ["Solicitações"],
      summary: "Atribuir Responsável (legado)",
      description:
        "Rota legada de atribuição por `professionalId` (UUID de `details_professional`). Use `PATCH /requests/{protocol}/internal/assignee`. " +
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
        "403": error("Sem `request:assign`."),
        "404": error("Protocolo inexistente ou fora da Custódia (`request_not_found`)."),
      },
    },
  },
};
