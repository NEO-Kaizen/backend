import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

/**
 * Especificação OpenAPI 3.0.1 do backend MAAT.
 *
 * Documenta apenas os endpoints existentes, sem criar rotas fictícias.
 * A autenticação é feita por cookie HttpOnly (`session_id`) com JWT.
 * Para testar endpoints protegidos no Swagger UI, primeiro chame
 * `POST /auth/login` — o servidor define o cookie e o navegador o envia
 * automaticamente nas requisições subsequentes.
 */

const openapiSpec = {
  openapi: "3.0.1",
  info: {
    title: "MAAT API",
    version: "1.0.0",
    description:
      "API do MAAT" +
      "Autenticação: JWT em cookie HttpOnly (`session_id`). " +
      "Faça login via `POST /auth/login` no Swagger UI para definir o cookie, " +
      "e então teste os endpoints protegidos.",
    contact: {
      name: "NEO Kaizen",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor de desenvolvimento local",
    },
  ],
  tags: [
    { name: "Autenticação", description: "Login, logout, sessão e troca de senha" },
    { name: "Solicitações", description: "Cadastro, consulta e atualização de solicitações" },
    { name: "Triagem", description: "Avaliação de triagem de solicitações" },
    { name: "Usuários", description: "Cadastro, listagem e métricas de usuários" },
    { name: "Fila de atendimento", description: "Métricas, listagem e mapeamento da fila" },
    { name: "Configuração do portal", description: "Configurações globais do portal (requer Administrador)" },
    { name: "Priorização", description: "Critérios e pontuação de priorização" },
    { name: "Relatórios", description: "Relatórios e exportações" },
    { name: "Auditoria", description: "Histórico de auditoria e logs" },
    { name: "Notas internas", description: "Notas internas de solicitações" },
    { name: "Pendências", description: "Pendências e verificação pública" },
  ],
  security: [
    {
      cookieAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session_id",
        description:
          "Cookie de sessão HttpOnly definido pelo servidor após login em `POST /auth/login`. " +
          "O navegador o envia automaticamente nas requisições. Não insira valor manualmente.",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["status", "statusCode", "message"],
        properties: {
          status: { type: "string", example: "error" },
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "E-mail ou senha ausentes." },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        required: ["status", "statusCode", "message", "fields"],
        properties: {
          status: { type: "string", example: "error" },
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "Erro de validação." },
          fields: {
            type: "object",
            additionalProperties: { type: "string" },
            example: { email: "Informe um e-mail válido." },
          },
        },
      },
      AuthenticatedUser: {
        type: "object",
        required: ["id", "email", "name", "role", "mustChangePassword"],
        properties: {
          id: { type: "string", example: "1" },
          email: { type: "string", example: "maria@instituicao.gov.br" },
          name: { type: "string", example: "Maria Oliveira" },
          avatarUrl: { type: "string", nullable: true, example: "/uploads/avatars/1-foto.jpg" },
          role: { type: "string", enum: ["Solicitante", "Analista", "Gestor", "Administrador"], example: "Analista" },
          mustChangePassword: { type: "boolean", example: false },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "maria@instituicao.gov.br" },
          password: { type: "string", format: "password", example: "123456" },
        },
      },
      LoginResponse: {
        type: "object",
        allOf: [
          { $ref: "#/components/schemas/AuthenticatedUser" },
          {
            type: "object",
            properties: {
              // cookie definido automaticamente pelo servidor (HttpOnly)
            },
          },
        ],
      },
      LogoutResponse: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string", example: "Sessão encerrada com sucesso" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword", "confirmNewPassword"],
        properties: {
          currentPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password" },
          confirmNewPassword: { type: "string", format: "password" },
        },
      },
      ChangePasswordResponse: {
        type: "object",
        allOf: [
          { $ref: "#/components/schemas/AuthenticatedUser" },
        ],
      },
      UserMetrics: {
        type: "object",
        required: ["total", "active", "pending", "admins"],
        properties: {
          total: { type: "integer", example: 15 },
          active: { type: "integer", example: 13 },
          pending: { type: "integer", example: 3 },
          admins: { type: "integer", example: 3 },
        },
      },
      UserListItem: {
        type: "object",
        required: ["id", "email", "name", "role", "isActive"],
        properties: {
          id: { type: "string", example: "1" },
          email: { type: "string", example: "maria@instituicao.gov.br" },
          name: { type: "string", example: "Maria Oliveira" },
          role: { type: "string", example: "Analista" },
          isActive: { type: "boolean", example: true },
          avatarUrl: { type: "string", nullable: true },
        },
      },
      RequestSummary: {
        type: "object",
        required: ["protocol", "title", "status", "createdAt"],
        properties: {
          protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
          title: { type: "string", example: "Automatizar conferência de diárias" },
          status: { type: "string", example: "Solicitação enviada" },
          createdAt: { type: "string", format: "date-time", example: "2026-08-25T14:03:11.000Z" },
          updatedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      RequestDetail: {
        type: "object",
        required: ["protocol", "demandTitle", "processName", "status", "openedAt"],
        properties: {
          protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
          demandTitle: { type: "string", example: "Automatizar conciliação bancária" },
          processName: { type: "string", example: "Conciliação bancária mensal" },
          status: { type: "string", example: "Em triagem" },
          assigneeName: { type: "string", nullable: true, example: "Fernando Alves" },
          openedAt: { type: "string", format: "date-time" },
          estimatedCompletion: { type: "string", nullable: true },
          mappingDate: { type: "string", nullable: true },
          meeting: {
            type: "object",
            properties: {
              scheduledFor: { type: "string", format: "date-time", nullable: true },
              link: { type: "string", nullable: true },
            },
          },
          pendingIssues: { type: "array", items: { type: "string" } },
          nextStep: { type: "string", nullable: true },
          lastTechnicalMessage: { type: "string", nullable: true },
          lastUpdate: { type: "string", format: "date-time", nullable: true },
          conclusion: { type: "string", nullable: true },
        },
      },
      QueueMetrics: {
        type: "object",
        required: ["totalRequests", "unassignedRequests", "inProgressRequests", "overdueRequests"],
        properties: {
          totalRequests: { type: "integer", example: 128 },
          unassignedRequests: { type: "integer", example: 31 },
          inProgressRequests: { type: "integer", example: 54 },
          overdueRequests: { type: "integer", example: 9 },
        },
      },
      QueueItem: {
        type: "object",
        required: ["protocol", "createdAt", "processName", "priority", "status", "assignee", "requesterName", "requesterEmail"],
        properties: {
          protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
          createdAt: { type: "string", format: "date-time" },
          processName: { type: "string", example: "Conciliação bancária mensal" },
          priority: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"], example: "Alta" },
          status: { type: "string", example: "Em triagem" },
          assignee: { type: "string", nullable: true, example: "Fernando Alves" },
          assigneeId: { type: "string", nullable: true, example: "650e8400-e29b-41d4-a716-446655440001" },
          requesterName: { type: "string", example: "Maria Oliveira" },
          requesterEmail: { type: "string", example: "maria.oliveira@instituicao.gov.br" },
        },
      },
      QueueResponse: {
        type: "object",
        required: ["data", "page", "pageSize", "total", "totalPages", "assignees"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/QueueItem" } },
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 10 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 5 },
          assignees: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", example: "650e8400-e29b-41d4-a716-446655440001" },
                name: { type: "string", example: "Fernando Alves" },
              },
            },
          },
        },
      },
      TriagemResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "660e8400-e29b-41d4-a716-446655440100" },
          adherentToScope: { type: "string", enum: ["Sim", "Não"], example: "Sim" },
          adherentJustification: { type: "string", example: "" },
          changeCategory: { type: "string", enum: ["Sim", "Não"], example: "Não" },
          newCategory: { type: "string", nullable: true },
          preliminaryComplexity: { type: "string", nullable: true },
          perceivedRisks: { type: "string", nullable: true },
          suggestedResponsible: { type: "string", nullable: true },
          suggestedResponsibleJustification: { type: "string", nullable: true },
          exitStatus: { type: "integer", example: 18 },
          result: { type: "string", nullable: true },
          conclusionJustification: { type: "string", nullable: true },
        },
      },
      MappingResponse: {
        type: "object",
        properties: {
          protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
          id: { type: "string", format: "uuid", example: "a6e8923e-7661-4827-9a6d-4898d9c70739" },
          scheduledFor: { type: "string", format: "date-time", nullable: true },
          durationMinutes: { type: "integer", nullable: true, minimum: 15, maximum: 480 },
          modality: { type: "string", enum: ["REMOTE", "IN_PERSON"], nullable: true },
          meetingLink: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          participants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", nullable: true },
                name: { type: "string" },
                email: { type: "string", format: "email" },
              },
            },
          },
          notes: { type: "string", nullable: true },
        },
      },
      PortalConfig: {
        type: "object",
        properties: {
          identity: { type: "object" },
          access: { type: "object" },
          theme: { type: "object" },
          assets: { type: "object" },
          categories: { type: "array" },
          statuses: { type: "array" },
          prioritizationWeights: { type: "object" },
        },
      },
      PrioritizationCriteria: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          weight: { type: "number", minimum: 0, maximum: 10 },
        },
      },
    },
  },
  paths: {
    // =========================================================================
    // Autenticação
    // =========================================================================
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
            description: "Credenciais inválidas (resposta genérica, sem revelar motivo).",
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
            description: "Sessão encerrada com sucesso.",
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
          "Altera a senha do usuário autenticado. Requer cookie de sessão válido. " +
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
    // =========================================================================
    // Solicitações
    // =========================================================================
    "/requests": {
      get: {
        tags: ["Solicitações"],
        summary: "Listar solicitações por e-mail",
        description:
          "Lista solicitações vinculadas a um e-mail de solicitante, ordenadas da mais recente para a mais antiga. " +
          "No modo `PUBLIC`, o e-mail vem da query (obrigatório). No modo `AUTHENTICATED`, " +
          "exige sessão e lista apenas as solicitações do e-mail da sessão (recusa `?email=` com 400).",
        operationId: "getRequestsByEmail",
        parameters: [
          {
            name: "email",
            in: "query",
            required: false,
            description: "E-mail do solicitante (apenas no modo PUBLIC).",
            schema: { type: "string", format: "email", example: "maria.oliveira@instituicao.gov.br" },
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
            description: "Array de solicitações (vazio se não houver).",
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
          "Público no modo `PUBLIC`; no modo `AUTHENTICATED` exige sessão e a identidade é resolvida " +
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
                      '{"requester":{"fullName":"Maria Oliveira","corporateEmail":"maria@instituicao.gov.br","area":"TI","department":"Desenvolvimento","manager":"José Silva","additionalContact":""},"demand":{"title":"Automatizar diárias","requestType":"Sistema","category":"Automação","processName":"Conferência de diárias","description":"...","problem":"...","expectedResult":"...","justification":"..."},"operational":{"processDescription":"...","processSteps":"...","systemsUsed":"Excel","executionFrequency":"Mensal","volumetry":"100","peopleInvolved":2,"averageExecutionTime":"4h","monthlyEffortHours":16,"hasManualControls":false,"mainRisks":"...","clientImpact":"Médio","operationalImpact":"Médio","desiredDeadline":"2026-12-31","perceivedCriticality":"Média"},"schedulePreferences":["2026-09-15T13:30","2026-09-16T10:00"]}',
                  },
                  attachments: {
                    type: "array",
                    items: {
                      type: "string",
                      format: "binary",
                    },
                    description: "0 a 5 arquivos (máx. 10 MB cada): PDF, DOCX, XLSX, PNG, JPG.",
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
                    createdAt: { type: "string", format: "date-time", example: "2026-08-25T14:03:11.000Z" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Payload inválido, anexo acima de 10 MB, formato não permitido ou mais de 5 anexos.",
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
            description: "Perfil sem acesso à solicitação.",
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
        summary: "Atualização interna de solicitação",
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
            description: "Solicitação atualizada.",
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
            description: "Usuário sem acesso à solicitação.",
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
          "Perfil permitido: Administrador e Analista. `Gestor` é read-only.",
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
                required: ["adherentToScope", "changeCategory", "exitStatus", "result", "conclusionJustification"],
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
                  justification: { type: "string", example: "Solicitação aprovada para mapeamento" },
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
            description: "Responsável atribuído com sucesso.",
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
    // =========================================================================
    // Usuários
    // =========================================================================
    "/users/me": {
      get: {
        tags: ["Usuários"],
        summary: "Consultar meu perfil",
        description: "Retorna os dados do usuário autenticado (self-service, qualquer perfil interno).",
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
        summary: "Métricas de usuários",
        description:
          "Retorna métricas consolidadas de usuários. Exige autenticação e perfil `Administrador`.",
        operationId: "getUserMetrics",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Métricas de usuários.",
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
        summary: "Listar usuários",
        description: "Lista todos os usuários cadastrados. Exige perfil `Administrador`.",
        operationId: "listUsers",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Lista de usuários.",
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
                required: ["email", "name", "password", "role"],
                properties: {
                  email: { type: "string", format: "email", example: "novo@instituicao.gov.br" },
                  name: { type: "string", example: "Novo Usuário" },
                  password: { type: "string", format: "password" },
                  role: { type: "string", enum: ["Solicitante", "Analista", "Gestor", "Administrador"], example: "Analista" },
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
        },
      },
    },
    "/users/:id": {
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
            schema: { type: "string", example: "1" },
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
            schema: { type: "string", example: "1" },
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
                  role: { type: "string", enum: ["Solicitante", "Analista", "Gestor", "Administrador"] },
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
    "/users/:id/status": {
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
            schema: { type: "string", example: "1" },
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
    "/users/:id/reset-password": {
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
            schema: { type: "string", example: "1" },
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
    // =========================================================================
    // Fila de atendimento
    // =========================================================================
    "/queue/metrics": {
      get: {
        tags: ["Fila de atendimento"],
        summary: "Métricas da fila",
        description:
          "Retorna métricas consolidadas da fila de atendimento. Exige autenticação e perfil interno (Analista, Gestor ou Administrador).",
        operationId: "getQueueMetrics",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Métricas da fila.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/QueueMetrics" },
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
    "/queue": {
      get: {
        tags: ["Fila de atendimento"],
        summary: "Listar fila de atendimento",
        description:
          "Centraliza a listagem da fila com paginação, busca e filtros. Exige autenticação e perfil interno.",
        operationId: "getQueue",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: true,
            description: "Número da página (>= 1).",
            schema: { type: "integer", minimum: 1, example: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            required: true,
            description: "Itens por página (1 a 100).",
            schema: { type: "integer", minimum: 1, maximum: 100, example: 10 },
          },
          {
            name: "search",
            in: "query",
            required: false,
            description: "Busca por protocolo, e-mail corporativo ou nome do solicitante.",
            schema: { type: "string", example: "MAAT-8K3P" },
          },
          {
            name: "status",
            in: "query",
            required: false,
            description: "Valor exato de um status válido.",
            schema: { type: "string", example: "Em triagem" },
          },
          {
            name: "priority",
            in: "query",
            required: false,
            description: "Valor exato de prioridade.",
            schema: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"], example: "Alta" },
          },
          {
            name: "assigneeId",
            in: "query",
            required: false,
            description: "UUID do profissional ou `unassigned`.",
            schema: { type: "string", example: "unassigned" },
          },
          {
            name: "unassigned",
            in: "query",
            required: false,
            description: "true/1 para listar apenas solicitações sem responsável.",
            schema: { type: "string", enum: ["true", "1", "false", "0"], example: "true" },
          },
        ],
        responses: {
          "200": {
            description: "Página de solicitações da fila.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/QueueResponse" },
              },
            },
          },
          "400": {
            description: "Parâmetros `page` ou `pageSize` ausentes ou inválidos.",
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
    "/queue/requests/:protocol/mapping": {
      get: {
        tags: ["Fila de atendimento"],
        summary: "Consultar mapeamento da solicitação",
        description:
          "Consulta o mapeamento mais recente de uma solicitação (agendamento). " +
          "Exige autenticação e perfil interno (Analista, Gestor ou Administrador).",
        operationId: "getMapping",
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
            description: "Mapeamento (ou estado vazio se não houver).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MappingResponse" },
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
            description: "Perfil sem acesso.",
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
      put: {
        tags: ["Fila de atendimento"],
        summary: "Criar ou atualizar mapeamento",
        description:
          "Cria ou atualiza o mapeamento da solicitação. Campos ausentes mantêm o valor atual; `null` limpa; `participants` substitui a lista.",
        operationId: "putMapping",
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
                  scheduledFor: { type: "string", format: "date-time", nullable: true },
                  durationMinutes: { type: "integer", minimum: 15, maximum: 480, nullable: true },
                  modality: { type: "string", enum: ["REMOTE", "IN_PERSON"], nullable: true },
                  meetingLink: { type: "string", nullable: true },
                  location: { type: "string", nullable: true },
                  participants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", nullable: true },
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                      },
                    },
                  },
                  notes: { type: "string", nullable: true },
                  mappingAssigneeId: { type: "string", nullable: true },
                  completeMapping: { type: "boolean", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Mapeamento atualizado com sucesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MappingResponse" },
              },
            },
          },
          "400": {
            description: "Payload malformado.",
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
            description: "Sem permissão para editar o mapeamento.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Protocolo ou mapeamento inexistente.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "422": {
            description: "Erro de validação de campos ou estado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
        },
      },
    },
    // =========================================================================
    // Configuração do portal
    // =========================================================================
    "/portal-config": {
      get: {
        tags: ["Configuração do portal"],
        summary: "Consultar configuração do portal",
        description:
          "Configuração consolidada (público): identity, access, theme, assets, categories, statuses, pesos de priorização.",
        operationId: "getPortalConfig",
        security: [],
        responses: {
          "200": {
            description: "Configuração consolidada do portal.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PortalConfig" },
              },
            },
          },
        },
      },
    },
    "/portal-config/access": {
      patch: {
        tags: ["Configuração do portal"],
        summary: "Alterar modo de acesso do portal",
        description:
          "Altera o modo de abertura do portal (`PUBLIC` ou `AUTHENTICATED`). Exige perfil `Administrador`.",
        operationId: "updatePortalAccess",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["solicitationMode"],
                properties: {
                  solicitationMode: { type: "string", enum: ["PUBLIC", "AUTHENTICATED"], example: "PUBLIC" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Modo de acesso alterado com sucesso.",
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
    // =========================================================================
    // Priorização
    // =========================================================================
    "/prioritization/criteria": {
      get: {
        tags: ["Priorização"],
        summary: "Listar critérios de priorização",
        description:
          "Lista os critérios de priorização com seus pesos. Exige autenticação e perfil interno.",
        operationId: "listPrioritizationCriteria",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Lista de critérios de priorização.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/PrioritizationCriteria" },
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
            description: "Perfil sem acesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/prioritization/:protocol/score": {
      put: {
        tags: ["Priorização"],
        summary: "Avaliar pontuação de priorização",
        description:
          "Avalia a pontuação de priorização de uma solicitação. Exige autenticação e perfil Analista ou Administrador.",
        operationId: "evaluatePrioritizationScore",
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
                properties: {},
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Pontuação avaliada com sucesso.",
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
            description: "Perfil sem acesso (apenas Analista ou Administrador).",
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
    // =========================================================================
    // Relatórios
    // =========================================================================
    "/reports/dashboard": {
      get: {
        tags: ["Relatórios"],
        summary: "Relatório do dashboard",
        description:
          "Retorna dados consolidados para o dashboard. Exige autenticação e perfil Gestor ou Administrador.",
        operationId: "getDashboard",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Dados do dashboard.",
            content: {
              "application/json": {
                schema: { type: "object" },
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
            description: "Perfil sem acesso (apenas Gestor ou Administrador).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/reports/requests.csv": {
      get: {
        tags: ["Relatórios"],
        summary: "Exportar solicitações em CSV",
        description:
          "Exporta as solicitações da fila em formato CSV. Exige autenticação e perfil Gestor ou Administrador.",
        operationId: "exportRequestsCsv",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Arquivo CSV com os dados das solicitações.",
            content: {
              "text/csv": {
                schema: { type: "string", format: "binary" },
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
            description: "Perfil sem acesso (apenas Gestor ou Administrador).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    // =========================================================================
    // Auditoria
    // =========================================================================
    "/audit-history": {
      get: {
        tags: ["Auditoria"],
        summary: "Listar histórico de auditoria",
        description:
          "Lista o histórico de auditoria. Exige autenticação e perfil Administrador ou Gestor.",
        operationId: "listAuditHistory",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Lista de registros de auditoria.",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "object" } },
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
            description: "Perfil sem acesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/audit-history/:id": {
      get: {
        tags: ["Auditoria"],
        summary: "Consultar detalhe de auditoria",
        description:
          "Consulta um registro específico de auditoria pelo ID. Exige autenticação e perfil Administrador ou Gestor.",
        operationId: "getAuditHistoryDetail",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "1" },
          },
        ],
        responses: {
          "200": {
            description: "Detalhe do registro de auditoria.",
            content: {
              "application/json": {
                schema: { type: "object" },
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
            description: "Perfil sem acesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Registro de auditoria não encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/audit-logs/:protocol": {
      get: {
        tags: ["Auditoria"],
        summary: "Consultar logs de auditoria por protocolo",
        description:
          "Retorna a timeline de auditoria de uma solicitação. Exige autenticação e perfil interno (Analista, Gestor ou Administrador).",
        operationId: "getAuditLogsByProtocol",
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
            description: "Timeline de auditoria da solicitação.",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "object" } },
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
            description: "Perfil sem acesso.",
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
    // =========================================================================
    // Notas internas
    // =========================================================================
    "/requests/:protocol/internal-notes": {
      get: {
        tags: ["Notas internas"],
        summary: "Listar notas internas",
        description:
          "Lista as notas internas de uma solicitação. Exige autenticação e perfil interno.",
        operationId: "listInternalNotes",
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
            description: "Lista de notas internas.",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "object" } },
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
            description: "Perfil sem acesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Notas internas"],
        summary: "Criar nota interna",
        description:
          "Cria uma nova nota interna para a solicitação. Exige autenticação e perfil interno.",
        operationId: "createInternalNote",
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
                required: ["content"],
                properties: {
                  content: { type: "string", example: "Nota importante sobre a solicitação" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Nota interna criada com sucesso.",
            content: {
              "application/json": {
                schema: { type: "object" },
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
            description: "Perfil sem acesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Notas internas"],
        summary: "Marcar notas internas como lidas",
        description:
          "Marca as notas internas de uma solicitação como lidas. Exige autenticação e perfil interno.",
        operationId: "markInternalNotesRead",
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
            description: "Notas marcadas como lidas.",
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
            description: "Perfil sem acesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    // =========================================================================
    // Pendências
    // =========================================================================
    "/requests/:protocol/pending-items": {
      get: {
        tags: ["Pendências"],
        summary: "Listar pendências",
        description:
          "Lista as pendências de uma solicitação via dual-auth (cookie ou header `X-Requester-Identity`).",
        operationId: "listPendingItems",
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
            description: "Lista de pendências.",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Pendências"],
        summary: "Criar pendências",
        description:
          "Cria pendências para uma solicitação. Exige autenticação e perfil interno.",
        operationId: "createPendingItems",
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
          "201": {
            description: "Pendências criadas com sucesso.",
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
            description: "Perfil sem acesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Pendências"],
        summary: "Revisar pendências",
        description:
          "Revisa (aprova/rejeita) pendências de uma solicitação. Exige autenticação e perfil interno.",
        operationId: "reviewPendingItems",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Pendências revisadas com sucesso.",
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
            description: "Perfil sem acesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/requests/:protocol/pending-items/:pendingItemId": {
      patch: {
        tags: ["Pendências"],
        summary: "Responder pendência",
        description:
          "Responde a uma pendência específica. Via dual-auth (cookie ou header `X-Requester-Identity`).",
        operationId: "respondPendingItem",
        security: [],
        parameters: [
          {
            name: "protocol",
            in: "path",
            required: true,
            schema: { type: "string", example: "MAAT-8K3P-9X2M" },
          },
          {
            name: "pendingItemId",
            in: "path",
            required: true,
            schema: { type: "string", example: "1" },
          },
        ],
        responses: {
          "200": {
            description: "Pendência respondida com sucesso.",
          },
        },
      },
      post: {
        tags: ["Pendências"],
        summary: "Anexar arquivo à pendência",
        description:
          "Anexa um arquivo a uma pendência. Via dual-auth (cookie ou header `X-Requester-Identity`).",
        operationId: "attachPendingItem",
        security: [],
        parameters: [
          {
            name: "protocol",
            in: "path",
            required: true,
            schema: { type: "string", example: "MAAT-8K3P-9X2M" },
          },
          {
            name: "pendingItemId",
            in: "path",
            required: true,
            schema: { type: "string", example: "1" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Anexo adicionado com sucesso.",
          },
          "400": {
            description: "Arquivo acima de 10 MB ou formato não permitido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/requests/:protocol/public/verify": {
      post: {
        tags: ["Pendências"],
        summary: "Verificação pública de pendência",
        description:
          "Endpoint público para verificação de pendência sem autenticação (modo PUBLIC).",
        operationId: "publicVerify",
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
            description: "Verificação realizada com sucesso.",
          },
        },
      },
    },
  },
} as const;

export const swaggerOptions = {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "MAAT API — Documentação",
};

/**
 * Monta o Swagger UI na aplicação Express.
 * Disponível em `GET /api-docs` (UI) e `GET /api-docs/swagger.json` (JSON).
 */
export function setupSwagger(app: Express): void {
  // Rota do JSON deve ser registrada ANTES do middleware estático do swagger-ui,
  // para que /api-docs/swagger.json retorne o JSON da especificação e não o HTML da UI.
  app.get("/api-docs/swagger.json", (_req, res) => {
    res.type("application/json").json(openapiSpec);
  });
  app.use("/api-docs", ...swaggerUi.serve, swaggerUi.setup(openapiSpec as unknown as Record<string, unknown>, swaggerOptions));
}
