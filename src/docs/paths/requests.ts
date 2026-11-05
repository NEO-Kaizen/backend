export default {
  "/requests": {
    get: {
      tags: ["Solicitações"],
      summary: "Listar Solicitações por e-mail",
      description:
        "Lista Solicitações vinculadas a um e-mail de solicitante, ordenadas da mais recente para a mais antiga. " +
        "No modo `PUBLIC`, o e-mail vem da query (obrigatório). No modo `AUTHENTICATED`, " +
        "exige sessão e lista apenas as Solicitações do e-mail da sessão (recusa `?email=` com 400).",
      operationId: "getRequestsByEmail",
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
          description: "Filtrar por status da solicitação.",
          schema: { type: "string", example: "Em triagem" },
        },
        {
          name: "page",
          in: "query",
          required: false,
          description: "Número da página (>= 1).",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "pageSize",
          in: "query",
          required: false,
          description: "Itens por página (1 a 10 no modo público).",
          schema: { type: "integer", minimum: 1, maximum: 10, default: 10 },
        },
      ],
      responses: {
        "200": {
          description: "Array de Solicitações (vazio se não houver).",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/RequestSummary" },
              },
            },
          },
        },
        "400": {
          description: "Query param `email` ausente ou inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Solicitações"],
      summary: "Criar solicitação",
      description:
        "Cadastra uma nova solicitação, gera o protocolo e persiste os blocos do formulário. " +
        "público no modo `PUBLIC`; no modo `AUTHENTICATED` exige sessão e a identidade é resolvida " +
        "pelo usuário logado (campos de identidade do payload são validados, mas sobrescritos).",
      operationId: "postRequest",
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
                    "JSON.stringify de { requester, demand, operational, complementary?, schedulePreferences? }.",
                  example:
                    '{"requester":{"fullName":"Maria Silva","corporateEmail":"maria.silva@empresa.com","area":"TI","department":"Desenvolvimento","manager":"José Silva","additionalContact":""},"demand":{"title":"Automatizar diárias","requestType":"Sistema","category":"Automação","processName":"Conferência de diárias","description":"...","problem":"...","expectedResult":"...","justification":"..."},"operational":{"processDescription":"...","processSteps":"...","systemsUsed":"Excel","executionFrequency":"Mensal","volumetry":"100","peopleInvolved":2,"averageExecutionTime":"4h","monthlyEffortHours":16,"hasManualControls":false,"mainRisks":"...","clientImpact":"Médio","operationalImpact":"Médio","desiredDeadline":"2026-12-31","perceivedCriticality":"Média"},"schedulePreferences":["2026-09-15T13:30","2026-09-16T10:00"]}',
                },
                attachments: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary",
                  },
                  description: "0 a 5 arquivos (max. 10 MB cada): PDF, DOCX, XLSX, PNG, JPG.",
                  maxItems: 5,
                },
              },
            },
            encoding: {
              payload: {
                contentType: "application/json",
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "solicitação criada com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["protocol", "status", "createdAt"],
                properties: {
                  protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
                  status: { type: "string", example: "solicitação enviada" },
                  createdAt: {
                    type: "string",
                    format: "date-time",
                    example: "2026-08-25T14:03:11.000Z",
                  },
                },
              },
            },
          },
        },
        "400": {
          description:
            "Payload inválido, anexo acima de 10 MB, formato não permitido ou mais de 5 anexos.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/assignees": {
    get: {
      tags: ["Solicitações"],
      summary: "Listar responsáveis por triagem",
      description:
        "Retorna a lista de profissionais com perfil `Analista` ativos, para uso no modal de atribuição de triagem.",
      operationId: "getAssignees",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Lista de analistas disponíveis.",
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
          description: "Perfil sem acesso (apenas Analista, Gestor, Administrador).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol": {
    get: {
      tags: ["Solicitações"],
      summary: "Consultar solicitação pelo protocolo",
      description:
        "Consulta pública (modo `PUBLIC`) ou autenticada (modo `AUTHENTICATED`, retorna 404 se não pertencer ao usuário logado).",
      operationId: "getRequestsByProtocol",
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          description: "Protocolo de rastreio (ex: MAAT-8K3P-9X2M).",
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      responses: {
        "200": {
          description: "Detalhes da solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestDetail" },
            },
          },
        },
        "404": {
          description: "Protocolo não encontrado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/internal": {
    get: {
      tags: ["Solicitações"],
      summary: "Consulta administrativa de solicitação",
      description:
        "Retorna os 4 blocos completos do cadastro, status, prioridade, responsável, anexos e observações internas. " +
        "Exige autenticação e perfil Analista, Gestor ou Administrador.",
      operationId: "getInternalRequestByProtocol",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      responses: {
        "200": {
          description: "Detalhes internos da solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestDetail" },
            },
          },
        },
        "401": {
          description: "Sem cookie ou token inválido/expirado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil sem acesso a solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Solicitações"],
      summary: "Atualizacao interna de solicitação",
      description:
        "Atualiza os blocos editáveis (`requester`, `demand`, `operational`, `complementary`). " +
        "Substituição completa: chave ausente = campo limpo (NULL). " +
        "Exige autenticação e perfil Analista, Gestor ou Administrador.",
      operationId: "patchInternalRequestByProtocol",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                requester: { type: "object" },
                demand: { type: "object" },
                operational: { type: "object" },
                complementary: { type: "object" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "solicitação atualizada.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestDetail" },
            },
          },
        },
        "401": {
          description: "Sem cookie de sessão.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfil não autorizado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "422": {
          description: "Erro de validação com campo `fields`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/triage": {
    get: {
      tags: ["Triagem"],
      summary: "Consultar triagem da solicitação",
      description:
        "Consulta a avaliação de triagem persistida para uma solicitação. Requer autenticação e acesso interno.",
      operationId: "getTriage",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      responses: {
        "200": {
          description: "Avaliação de triagem (ou null se ainda não existir).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TriagemResponse" },
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
          description: "Usuário sem acesso a solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Triagem"],
      summary: "Criar triagem da solicitação",
      description:
        "Cria a triagem da solicitação (append — cada chamada gera uma nova row). " +
        "Perfil permitido: Administrador e Analista. `Gestor` e read-only.",
      operationId: "saveTriage",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "adherentToScope",
                "changeCategory",
                "exitStatus",
                "result",
                "conclusionJustification",
              ],
              properties: {
                adherentToScope: { type: "string", enum: ["Sim", "Não"], example: "Sim" },
                adherentJustification: { type: "string", example: "" },
                changeCategory: { type: "string", enum: ["Sim", "Não"], example: "Não" },
                newCategory: { type: "string", nullable: true },
                preliminaryComplexity: { type: "string", nullable: true },
                perceivedRisks: { type: "string", nullable: true },
                suggestedResponsible: { type: "string", nullable: true },
                suggestedResponsibleJustification: { type: "string", nullable: true },
                exitStatus: { type: "integer", example: 18 },
                result: { type: "string", example: "Aprovado para mapeamento" },
                conclusionJustification: { type: "string", example: "Escopo bem definido." },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Triagem criada com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TriagemResponse" },
            },
          },
        },
        "400": {
          description: "Payload inválido ou parâmetros fora do esperado.",
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
          description: "Usuário não autorizado para a solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "422": {
          description: "Erro de validação da triagem, com campos detalhados em `fields`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/tracking": {
    get: {
      tags: ["Solicitações"],
      summary: "Acompanhamento público da solicitação",
      description:
        "Acompanhamento do solicitante via dual-auth (cookie de sessão OU header `X-Requester-Identity`).",
      operationId: "getTracking",
      security: [],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      responses: {
        "200": {
          description: "Dados de acompanhamento da solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestDetail" },
            },
          },
        },
        "404": {
          description: "Protocolo não encontrado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/status": {
    patch: {
      tags: ["Solicitações"],
      summary: "Trocar status da solicitação",
      description:
        "Troca única de status do Motor de Status v4. Administrador faz bypass; responsável com custódia apenas para status `free` e `isRestricted=false`. Exige justificativa.",
      operationId: "patchRequestStatus",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["targetStatus", "justification"],
              properties: {
                targetStatus: { type: "integer", example: 18 },
                justification: { type: "string", example: "solicitação aprovada para mapeamento" },
                lastTechnicalMessage: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Status alterado com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestDetail" },
            },
          },
        },
        "400": {
          description: "Payload inválido.",
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
          description: "Sem permissão para alterar o status.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "422": {
          description: "Erro de validação ou estado inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/internal/assignee": {
    patch: {
      tags: ["Solicitações"],
      summary: "Atribuir responsável interno",
      description:
        "Define ou remove o responsável (assignee) ou mapeamento (mappingAssigneeId). " +
        "Exatamente um dos dois campos deve ser informado. Exige perfil Analista ou Administrador.",
      operationId: "patchInternalAssignee",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                assigneeId: { type: "string", nullable: true },
                mappingAssigneeId: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "responsável atribuido com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestDetail" },
            },
          },
        },
        "400": {
          description: "Payload inválido (não informou exatamente um dos campos).",
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
          description: "Perfil não autorizado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente.",
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
