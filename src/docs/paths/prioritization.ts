import { protocolParam } from "../components/parameters.ts";
import { error, json } from "../components/responses.ts";

export default {
  "/prioritization/criteria": {
    get: {
      tags: ["Priorização"],
      summary: "Listar critérios de priorização",
      description:
        "Lista os critérios ativos e seus pesos. Exige `prioritization:write` (avaliador) ou `prioritization_config:read` (configuração).",
      operationId: "listPrioritizationCriteria",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Critérios ativos.",
          ...json("PrioritizationCriteriaList"),
        },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sem chave de priorização."),
      },
    },
  },

  "/prioritization/{protocol}/score": {
    put: {
      tags: ["Priorização"],
      summary: "Avaliar pontuação de priorização",
      description:
        "Calcula e persiste a priorização (RN-007/RN-008) na mesma transação do evento `prioritization.evaluate`. " +
        "Todas as notas dos critérios ativos são obrigatórias. Exige `prioritization:write` + Custódia do Responsável da triagem (comportamento anterior ao RBAC; confirmação pendente com Produto).",
      operationId: "evaluatePrioritizationScore",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EvaluatePrioritizationRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Priorização avaliada.",
          ...json("EvaluatePrioritizationResponse"),
        },
        "400": error("Payload inválido ou notas incompletas."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sem `prioritization:write` ou Custódia da linha."),
        "404": error("Protocolo inexistente."),
        "409": error("Ciclo ou custódia alterado durante a avaliação."),
      },
    },
  },
};
