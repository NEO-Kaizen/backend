export default {
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
  "/reports/request/internal/{protocol}/pdf": {
    get: {
      tags: ["Relatórios"],
      summary: "Exportar solicitação em PDF (interno)",
      description:
        "Exporta os dados completos de uma solicitação em PDF. Exige autenticação e perfil Gestor ou Administrador. O PDF inclui identificação, solicitante, demanda, operação, complementar, responsáveis, anexos e observações internas. A triagem não é incluída.",
      operationId: "getReportPdf",
      parameters: [{ name: "protocol", in: "path", required: true, schema: { type: "string" } }],
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "PDF gerado com os dados da solicitação.",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        "400": {
          description: "Protocolo inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Token não fornecido ou expirado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Acesso restrito ao perfil Gestor ou Administrador.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação não encontrada.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/pdf": {
    get: {
      tags: ["Relatórios"],
      summary: "Exportar solicitação em PDF (solicitante)",
      description:
        "Exporta os dados da solicitação em PDF para o solicitante. Dois fluxos estão disponíveis: (1) com cookie de sessão do solicitante dono, que retorna o PDF no modo `authenticated` com dados completos; (2) com header `X-Requester-Identity`, que retorna o PDF no modo `public` com apenas os dados que o solicitante já vê na tela (identificação, solicitante, demanda e impactos). A triagem nunca é incluída.",
      operationId: "getRequesterRequestPdf",
      security: [{ cookieAuth: [], headerAuth: [] }],
      responses: {
        "200": {
          description: "PDF gerado com os dados da solicitação.",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        "400": {
          description: "Protocolo é obrigatório.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Valide seus dados para acompanhar esta solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Perfis internos devem acompanhar pela consulta interna.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
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
};
