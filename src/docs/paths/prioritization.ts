const json = (ref: string) => ({
  content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } },
});

const error = (description: string) => ({
  description,
  ...json("ErrorResponse"),
});

export default {
  "/prioritization/criteria": {
    get: {
      tags: ["Priorização"],
      summary: "Listar critérios de priorização",
      description:
        "Lista os critérios ativos e seus pesos. Leitura liberada aos perfis internos (Gestor é somente leitura também aqui).",
      operationId: "listPrioritizationCriteria",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Critérios ativos.",
          ...json("PrioritizationCriteriaList"),
        },
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso."),
      },
    },
  },

  "/prioritization/{protocol}/score": {
    put: {
      tags: ["Priorização"],
      summary: "Avaliar pontuação de priorização",
      description:
        "Calcula e persiste a priorização (RN-007/RN-008) na mesma transação do evento `prioritization.evaluate`. " +
        "Todas as notas dos critérios ativos são obrigatórias. Perfis: Administrador ou Analista responsável pela solicitação.",
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
        "403": error("Perfil ou custódia insuficiente."),
        "404": error("Protocolo inexistente."),
      },
    },
  },
};
