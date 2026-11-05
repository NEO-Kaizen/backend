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
  "/prioritization/:protocol/score": {
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
};
