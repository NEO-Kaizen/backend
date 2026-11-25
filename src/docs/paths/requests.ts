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
        "403": error("Perfil sem acesso (Analista, Gestor ou Administrador)."),
      },
    },
  },

  "/requests/duplicates/check": {
    post: {
      tags: ["Solicitações"],
      summary: "Verificar duplicidade da Demanda",
      description:
        "Consulta o corpus público curado ao concluir a aba de Demanda (RF16). " +
        "Público no modo `PUBLIC` e com sessão obrigatória no modo `AUTHENTICATED`; sujeito a rate limit por IP. " +
        "A resposta nunca ecoa o texto enviado e pode trazer apenas `publicId`, `title`, `summary`, `category`, `status` e `period`. " +
        'Flag desligada, índice indisponível ou falha de busca degradam para `200` com `confidence: "none"` e `items: []`. ' +
        "Solicitações em aberto aparecem apenas com o resumo de template; concluídas entram com texto tarjado (issue #210). " +
        "O Alerta não vincula registros nem altera Status — a Marcação de duplicidade é o ato formal do RF25.",
      operationId: "postDuplicateCheck",
      security: [{}, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/DuplicateCheckRequest" },
            example: {
              demand: {
                title: "Automatizar conciliação bancária",
                requestType: "Automação",
                category: "Automação",
                processName: "Conciliação bancária mensal",
                description: "Conferência manual de extratos e lançamentos.",
                problem: "Retrabalho e risco de divergência no fechamento.",
                expectedResult: "Conciliação automática com trilha de conferência.",
                justification: "Reduzir esforço manual do time financeiro.",
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description:
            "Faixa de confiança e itens públicos do Alerta de duplicidade. Resposta com `Cache-Control: no-store`.",
          headers: {
            "Cache-Control": {
              description: "Impede cache da resposta com dados de terceiros.",
              schema: { type: "string", example: "no-store" },
            },
          },
          ...json("DuplicateCheckResponse"),
        },
        "401": error("Modo AUTHENTICATED sem sessão válida."),
        "422": error(
          "Corpo inválido, campo obrigatório ausente ou chave desconhecida.",
          "ValidationErrorResponse",
        ),
        "429": error("Muitas requisições (rate limit por IP)."),
        "500": error("Falha interna genérica, sem detalhe do corpus."),
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
        "Requer perfil Analista (restrito às solicitações atribuídas), Gestor ou Administrador.",
      operationId: "getInternalRequestByProtocol",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      responses: {
        "200": { description: "Detalhe interno da solicitação.", ...json("InternalRequestDetail") },
        "401": error("Sem cookie ou token inválido/expirado."),
        "403": error("Perfil ou custódia insuficiente."),
        "404": error("Protocolo inexistente."),
      },
    },
    patch: {
      tags: ["Solicitações"],
      summary: "Atualização interna de solicitação",
      description:
        "Substitui os blocos editáveis (`requester`, `demand`, `operational`, `complementary`). " +
        "Chave ausente = campo limpo (NULL). Administrador/Gestor editam qualquer solicitação; Analista apenas as atribuídas a ele.",
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
        "200": { description: "Solicitação atualizada.", ...json("InternalRequestDetail") },
        "400": error("Payload inválido."),
        "401": error("Sem cookie de sessão."),
        "403": error("Perfil ou custódia insuficiente."),
        "404": error("Protocolo inexistente."),
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
        "403": error("Perfil interno ou verificação indisponível no modo AUTHENTICATED."),
        "404": error("Protocolo não encontrado ou de terceiro."),
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
        "403": error("Sem permissão para alterar o status."),
        "404": error("Protocolo ou status de destino inexistente."),
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
        "403": error("Perfil ou custódia insuficiente."),
        "404": error("Protocolo inexistente."),
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
        "403": error("Perfil ou custódia insuficiente."),
        "404": error("Protocolo inexistente."),
      },
    },
  },
};
