export default {
  "/prioritization/criteria": {
    get: {
      tags: ["Priorização"],
      summary: "Listar critérios de Priorização",
      description:
        "Lista os critérios de Priorização com seus pesos. Exige autenticação e perfil interno.",
      operationId: "listPrioritizationCriteria",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Lista de critérios de Priorização.",
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
  "/prioritization/{protocol}/score": {
    put: {
      tags: ["Priorização"],
      summary: "Avaliar pontuação de Priorização",
      description:
        "Avalia a pontuação de Priorização de uma solicitação. Exige autenticação e perfil Analista ou Administrador.",
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
              properties: {
                notes: {
                  type: "object",
                  additionalProperties: {
                    type: "integer",
                    minimum: 1,
                    maximum: 5,
                  },
                  description: "Notas de 1 a 5 para cada critério de priorização.",
                  example: {
                    impacto_operacional: 4,
                    risco_operacional: 3,
                    urgencia: 4,
                    volumetria: 3,
                    esforco_manual: 2,
                    impacto_cliente: 4,
                    prazo_regulatorio: 3,
                    areas_impactadas: 3,
                    alinhamento_estrategico: 4,
                    complexidade_estimada: 3,
                  },
                },
                justification: {
                  type: "string",
                  maxLength: 500,
                  example:
                    "Solicitação priorizada com base no impacto operacional e urgência do negócio.",
                },
              },
              required: ["notes"],
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
};
