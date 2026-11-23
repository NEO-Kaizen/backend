export default {
  "/reports/dashboard": {
    get: {
      tags: ["Relatórios"],
      summary: "Relatório do dashboard",
      description:
        "Retorna dados consolidados para o dashboard. Exige a permissão global `reports:read`.",
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
          description: "Ator sem `reports:read`.",
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
        "Exporta a Fila em CSV. Exige `queue:export`; a Custódia `assigned` limita a exportação às solicitações em que o ator é Responsável da triagem ou do Mapeamento corrente. O Analista do perfil base não recebe essa permissão.",
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
          description: "Ator sem `queue:export`.",
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
