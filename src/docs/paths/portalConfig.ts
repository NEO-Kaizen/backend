export default {
  "/portal-config": {
    get: {
      tags: ["Configuração do portal"],
      summary: "Consultar configuração do portal",
      description:
        "Configuração consolidada (publico): identity, access, theme, assets, categories, statuses, pesos de priorização.",
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
                solicitationMode: {
                  type: "string",
                  enum: ["PUBLIC", "AUTHENTICATED"],
                  example: "PUBLIC",
                },
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
};
