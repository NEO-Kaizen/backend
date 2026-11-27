import {
  createdFromParam,
  createdToParam,
  departmentParam,
  protocolParam,
  searchParam,
  sortByParam,
  sortOrderParam,
} from "../components/parameters.ts";
import { error, json } from "../components/responses.ts";

export default {
  "/queue/metrics": {
    get: {
      tags: ["Fila de atendimento"],
      summary: "Métricas da fila",
      description:
        "Métricas consolidadas da fila. `queue:read` em `assigned` considera apenas as solicitações em que o ator é Responsável (triagem ou mapeamento); `all` vê o total.",
      operationId: "getQueueMetrics",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": { description: "Métricas da fila.", ...json("QueueMetrics") },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sem `queue:read`."),
      },
    },
  },

  "/queue": {
    get: {
      tags: ["Fila de atendimento"],
      summary: "Listar fila de atendimento",
      description:
        "Listagem paginada da fila com busca por conteúdo, filtros por data/departamento e ordenação. " +
        "As datas comparam `created_at` em UTC e são inclusivas nas duas pontas. " +
        "Os filtros são combináveis entre si e com `search`. `queue:read` em `assigned` vê apenas as solicitações sob sua responsabilidade; `all` vê todas. A busca por notas internas usa a custódia de `internal_note:read`.",
      operationId: "getQueue",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          required: true,
          schema: { type: "integer", minimum: 1, example: 1 },
        },
        {
          name: "pageSize",
          in: "query",
          required: true,
          schema: { type: "integer", minimum: 1, maximum: 100, example: 10 },
        },
        searchParam,
        {
          name: "status",
          in: "query",
          required: false,
          description: "Nome exato de um status; valor inexistente não é validado contra o banco.",
          schema: { type: "string", maxLength: 100, example: "Em triagem" },
        },
        {
          name: "priority",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["Baixa", "Média", "Alta", "Crítica", "nenhum"],
          },
        },
        {
          name: "assigneeId",
          in: "query",
          required: false,
          description:
            "`details_professional.professional_id` (UUID), `users.user_id` numérico ou `unassigned`.",
          schema: { type: "string" },
        },
        {
          name: "unassigned",
          in: "query",
          required: false,
          description:
            "`true`/`1` lista apenas sem responsável. Não pode ser combinado com `assigneeId` diferente de `unassigned`.",
          schema: { type: "string", enum: ["true", "1", "false", "0"] },
        },
        createdFromParam,
        createdToParam,
        departmentParam,
        sortByParam,
        sortOrderParam,
      ],
      responses: {
        "200": { description: "Página da fila.", ...json("QueueResponse") },
        "400": error("Parâmetros ausentes ou inválidos."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sem `queue:read`."),
      },
    },
  },

  "/queue/requests/{protocol}/mapping": {
    get: {
      tags: ["Fila de atendimento"],
      summary: "Consultar mapeamento da solicitação",
      description: "Retorna o mapeamento mais recente ou o estado vazio (`id: null`).",
      operationId: "getMapping",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      responses: {
        "200": { description: "Mapeamento atual.", ...json("MappingResponse") },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sem `queue:read`."),
        "404": error("Protocolo inexistente."),
      },
    },
    put: {
      tags: ["Fila de atendimento"],
      summary: "Criar ou atualizar mapeamento",
      description:
        "Campo ausente mantém o valor atual; `null` limpa; `participants` substitui a lista por completo. " +
        "`completeMapping: true` exige `targetStatus`; quando o destino é `Mapeamento agendado` (id 6), exige reunião válida (modalidade, data, duração e link/local); " +
        "para os demais destinos exige `justification` e, se o destino for público, `lastTechnicalMessage`.",
      operationId: "putMapping",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MappingPayload" },
            examples: {
              conclusao: {
                summary: "Concluir mapeamento com designação",
                value: {
                  mappingAssigneeId: "550e8400-e29b-41d4-a716-446655440000",
                  participants: [
                    { id: "123", name: "João Silva", email: "joao@empresa.com" },
                    { name: "Externo", email: "externo@email.com" },
                  ],
                  notes: "Ajuste de horário acordado",
                  completeMapping: true,
                  targetStatus: 6,
                  justification: "Conclusão do mapeamento por acordo entre as partes",
                  lastTechnicalMessage: "Seu mapeamento foi concluído.",
                },
              },
              semConclusao: {
                summary: "Atualizar dados sem concluir",
                value: {
                  scheduledFor: "2026-11-20T10:30:00-03:00",
                  durationMinutes: 60,
                  modality: "REMOTE",
                  meetingLink: "https://meet.exemplo.com/sala",
                  location: null,
                  participants: [{ id: "123", name: "João Silva", email: "joao@empresa.com" }],
                  notes: "Reunião remota confirmada",
                  mappingAssigneeId: null,
                  completeMapping: false,
                },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Mapeamento atualizado.", ...json("MappingResponse") },
        "400": error("Payload malformado ou vazio."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sem `mapping:write` ou Custódia do mapeamento corrente."),
        "404": error("Protocolo ou mapeamento inexistente."),
        "409": error("Conflito de concorrência na transição."),
        "422": error("Erro de validação de campos ou estado."),
      },
    },
  },
};
