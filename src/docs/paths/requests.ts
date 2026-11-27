export default {
  "/requests": {
    get: {
      tags: ["Solicitações"],
      summary: "Listar Solicitações por e-mail",
      description:
        "Lista Solicitações vinculadas a um e-mail de solicitante, ordenadas da mais recente para a mais antiga. " +
        "Sem sessão no modo `PUBLIC`, o e-mail vem da query (obrigatório) e a porta pública não avalia chaves. " +
        "Com sessão (em `PUBLIC` ou `AUTHENTICATED`), exige `request:track` em `own`, lista apenas as " +
        "Solicitações do e-mail da sessão e recusa `?email=` com 400.",
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
        "401": {
          description: "Modo `AUTHENTICATED` sem sessão válida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `request:track`.",
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
        "Sem sessão no modo `PUBLIC`, é público. Com sessão (em `PUBLIC` ou `AUTHENTICATED`), exige " +
        "`request:create`, e a identidade é resolvida pelo usuário logado (campos do payload são validados, mas sobrescritos).",
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
          description: "Solicitação criada com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["protocol", "status", "createdAt"],
                properties: {
                  protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
                  status: { type: "string", example: "Solicitação enviada" },
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
        "401": {
          description: "Modo `AUTHENTICATED` sem sessão válida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `request:create`.",
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
      summary: "Listar responsáveis atribuíveis",
      description:
        "Exige `assignee_directory:read`. Retorna profissionais com conta, Perfil e extensão ativos, flag de Atribuibilidade habilitada e permissões exigidas pela etapa.",
      operationId: "getAssignees",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Lista de Responsáveis atribuíveis.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/AssigneeSummary" },
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
          description: "Ator sem `assignee_directory:read`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}": {
    get: {
      tags: ["Solicitações"],
      summary: "Consultar solicitação pelo protocolo",
      description:
        "Consulta sem sessão no modo `PUBLIC` ou autenticada com sessão: com sessão, exige `request:track` em `own` " +
        "e retorna 404 se não pertencer ao usuário logado. Qualquer Perfil autenticado que tenha aberto a " +
        "solicitação usa esta projeção do Solicitante.",
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
          description: "Protocolo não encontrado ou fora da Posse do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Modo `AUTHENTICATED` sem sessão válida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `request:track`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}/internal": {
    get: {
      tags: ["Solicitações"],
      summary: "Consulta administrativa de solicitação",
      description:
        "Retorna os 4 blocos completos do cadastro, status, prioridade, responsável, anexos e observações internas. " +
        "Exige `request:read`; a Custódia `assigned` limita a leitura às linhas sob responsabilidade do ator, e `all` permite qualquer linha.",
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
              schema: { $ref: "#/components/schemas/RequestInternalDetail" },
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
          description: "Ator autenticado sem `request:read`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente ou fora da Custódia de leitura.",
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
      summary: "Atualização interna de solicitação",
      description:
        "Atualiza os blocos editáveis (`requester`, `demand`, `operational`, `complementary`). " +
        "Substituição completa: chave ausente = campo limpo (NULL). " +
        "Exige `request:write` e Custódia sobre a linha. `request:write` requer também `request:read`; Custódias de leitura e escrita podem ter alcances diferentes.",
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
            schema: { $ref: "#/components/schemas/InternalRequestUpdate" },
          },
        },
      },
      responses: {
        "200": {
          description: "Solicitação atualizada.",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/RequestInternalDetail" },
                  { $ref: "#/components/schemas/RequestMutationAcknowledgement" },
                ],
              },
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
          description: "Ator sem `request:write`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente ou fora da Custódia de escrita.",
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
  "/requests/{protocol}/triage": {
    get: {
      tags: ["Triagem"],
      summary: "Consultar triagem da solicitação",
      description:
        "Consulta a triagem persistida. Exige `triage:read` e Custódia sobre o Responsável corrente da solicitação; snapshots não concedem acesso.",
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
        "Cria uma triagem (cada chamada gera uma nova avaliação). Exige `triage:write` e Custódia sobre o Responsável corrente da solicitação; Status atual restrito também exige `request:status_override` global. Snapshots não concedem acesso.",
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
  "/requests/{protocol}/tracking": {
    get: {
      tags: ["Solicitações"],
      summary: "Acompanhamento da solicitação",
      description:
        "Acompanhamento via dual-auth (cookie de sessão OU header `X-Requester-Identity`). " +
        "Com sessão, exige `request:track` em `own`; a Posse é o vínculo `requester_user_id` e, em linhas legadas, o e-mail da conta. " +
        "Qualquer Perfil autenticado que abriu a solicitação recebe apenas a projeção do Solicitante. " +
        "Sem sessão no modo `PUBLIC`, a identidade pública é validada sem chave.",
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
          description: "Protocolo não encontrado ou fora da Posse do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Identidade pública ausente/divergente ou sessão inválida.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `request:track` ou identidade pública no modo `AUTHENTICATED`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}/status": {
    patch: {
      tags: ["Solicitações"],
      summary: "Trocar status da solicitação",
      description:
        "Exige `request:status_change` e Custódia sobre a solicitação. Status restritos ou fora do modo da etapa exigem `request:status_override` global. Alvo inativo retorna 409; recusas por Custódia mantêm 404 para não revelar a solicitação.",
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
              schema: { $ref: "#/components/schemas/RequestStatusChangeResponse" },
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
          description: "Sem `request:status_change` ou sem `request:status_override` para o alvo.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description:
            "Solicitação inexistente ou fora da Custódia do ator; alvo de status inexistente.",
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
        "409": {
          description: "Status de destino inativo.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}/assignee": {
    patch: {
      tags: ["Solicitações"],
      summary: "Definir ou remover responsável",
      description:
        "Rota legada de designação. Exige `request:assign` e Custódia sobre a solicitação. O service valida a Atribuibilidade do alvo também em reatribuições; alvo inválido retorna 400 com code `assignee_not_assignable`. Quem criou a solicitação não pode ser o Responsável (`assignee_is_requester`).",
      operationId: "patchRequestAssignee",
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
                professionalId: {
                  type: "string",
                  format: "uuid",
                  nullable: true,
                  description: "UUID do responsável; omitido ou null remove o responsável.",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Responsável atualizado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AssignRequestResponse" },
            },
          },
        },
        "400": {
          description:
            "Payload inválido, alvo não atribuível (`assignee_not_assignable`) ou criador da " +
            "solicitação escolhido como Responsável (`assignee_is_requester`).",
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
          description: "Ator sem `request:assign`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação inexistente ou fora da Custódia do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/{protocol}/internal/assignee": {
    patch: {
      tags: ["Solicitações"],
      summary: "Atribuir responsável interno",
      description:
        "Define ou remove o responsável (assignee) ou mapeamento (mappingAssigneeId). " +
        "Exatamente um dos dois campos deve ser informado. Exige `request:assign` e Custódia sobre a solicitação; o service valida a Atribuibilidade do alvo. Alvo inválido retorna 400 com code `assignee_not_assignable`. Quem criou a solicitação não pode ser o Responsável (`assignee_is_requester`).",
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
              oneOf: [
                {
                  type: "object",
                  required: ["assigneeId"],
                  properties: { assigneeId: { type: "string", nullable: true } },
                },
                {
                  type: "object",
                  required: ["mappingAssigneeId"],
                  properties: { mappingAssigneeId: { type: "string", nullable: true } },
                },
              ],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Responsável atribuído com sucesso.",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/RequestInternalDetail" },
                  { $ref: "#/components/schemas/RequestMutationAcknowledgement" },
                ],
              },
            },
          },
        },
        "400": {
          description:
            "Payload inválido, alvo não atribuível (`assignee_not_assignable`) ou criador da " +
            "solicitação escolhido como Responsável (`assignee_is_requester`).",
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
          description: "Ator sem `request:assign`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação inexistente ou fora da Custódia do ator.",
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
