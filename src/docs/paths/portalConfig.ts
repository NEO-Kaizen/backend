export default {
  "/portal-config": {
    get: {
      tags: ["Configuração do portal"],
      summary: "Consultar configuração do portal",
      description:
        "Configuração consolidada (pública). Retorna um objeto plano com platformName, solicitationMode, protocolMask, theme, assets, categories, statuses e prioritizationWeights.",
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
        "401": {
          description: "Não autenticado.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/portal-config/sections": {
    get: {
      tags: ["Configuração do portal"],
      summary: "Consultar seções legíveis da configuração do portal",
      description:
        "Configuração do portal recortada pelas seções legíveis ao ator. Exige ao menos uma chave de leitura de seção — `theme:read`, `category:read`, `status:read`, " +
        "`portal_setting:read` ou `prioritization_config:read` — e devolve apenas as seções que o ator pode ler: " +
        "`portal_setting:read` → platformName, solicitationMode, protocolMask; `theme:read` → theme, assets; " +
        "`category:read` → categories; `status:read` → statuses; `prioritization_config:read` → prioritizationWeights. " +
        "A projeção pública de `GET /portal-config` permanece sem chave.",
      operationId: "getReadableSections",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Configuração recortada pelas seções legíveis ao ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PortalSections" },
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
          description: "Sem nenhuma chave de leitura do portal.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
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
        "Altera o modo de abertura do portal (`PUBLIC` ou `AUTHENTICATED`). Exige a permissão `portal_setting:manage`.",
      operationId: "updatePortalAccess",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PortalAccessPatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Modo de acesso alterado com sucesso.",
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
        "400": {
          description: "Body inválido.",
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
          description: "Sem a permissão exigida para a operação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/portal-config/identity": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar identidade do portal",
      description:
        "Altera o nome da plataforma (`platformName`) e/ou a máscara do protocolo (`protocolMask`). Exige a permissão `portal_setting:manage`.",
      operationId: "updatePortalIdentity",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PortalIdentityPatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Identidade alterada com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  platformName: { type: "string", example: "MAAT" },
                  protocolMask: { type: "string", example: "MAAT" },
                },
              },
            },
          },
        },
        "400": {
          description: "Body inválido (informe ao menos um campo).",
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
          description: "Sem a permissão exigida para a operação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/portal-config/theme": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar tema do portal",
      description:
        "Altera o tema completo (light/dark) de forma atômica. Exige a permissão `theme:manage`.",
      operationId: "updatePortalTheme",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PortalThemePatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Tema alterado com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PortalTheme" },
            },
          },
        },
        "400": {
          description: "Body inválido.",
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
          description: "Sem a permissão exigida para a operação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/portal-config/assets": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar assets do portal",
      description:
        "Altera assets (logo, avatar, login image, favicon em claro/escuro) via multipart/form-data. Aceita JSON na parte `assets` e/ou arquivos binários. Exige a permissão `theme:manage`.",
      operationId: "updatePortalAssets",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                assets: {
                  type: "string",
                  description:
                    "JSON com chaves de asset (URLs diretas), enviado como CAMPO DE TEXTO (não arquivo). " +
                    'Ex: {"logoLightUrl": "/uploads/portal/logo-light.png", "logoUsePrimaryColor": false}.',
                  example:
                    '{"logoLightUrl":"/uploads/portal/logo-light.png","logoUsePrimaryColor":false}',
                },
                // Arquivos binários individuais (campos de upload, opcionais):
                logoLightUrl: {
                  type: "string",
                  format: "binary",
                  description: "Imagem PNG/SVG (máx 2MB).",
                },
                logoDarkUrl: {
                  type: "string",
                  format: "binary",
                  description: "Imagem PNG/SVG (máx 2MB).",
                },
                avatarLightUrl: {
                  type: "string",
                  format: "binary",
                  description: "Imagem JPG/PNG (máx 2MB).",
                },
                avatarDarkUrl: {
                  type: "string",
                  format: "binary",
                  description: "Imagem JPG/PNG (máx 2MB).",
                },
                loginImageLightUrl: {
                  type: "string",
                  format: "binary",
                  description: "Imagem JPG/PNG/WEBP (máx 5MB).",
                },
                loginImageDarkUrl: {
                  type: "string",
                  format: "binary",
                  description: "Imagem JPG/PNG/WEBP (máx 5MB).",
                },
                faviconLightUrl: {
                  type: "string",
                  format: "binary",
                  description: "Ícone ICO/SVG/PNG (máx 1MB).",
                },
                faviconDarkUrl: {
                  type: "string",
                  format: "binary",
                  description: "Ícone ICO/SVG/PNG (máx 1MB).",
                },
              },
            },
            encoding: {
              assets: { contentType: "application/json" },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Assets alterados com sucesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PortalAssets" },
            },
          },
        },
        "400": {
          description: "Body inválido, JSON malformado ou nenhum asset informado.",
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
          description: "Sem a permissão exigida para a operação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/portal-config/categories": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar categorias do portal",
      description:
        "Substitui a lista completa de categorias de forma atômica. Exige a permissão `category:manage`.",
      operationId: "updatePortalCategories",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PortalCategoriesPatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Categorias alteradas com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["categories"],
                properties: {
                  categories: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PortalCategory" },
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Body inválido.",
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
          description: "Sem a permissão exigida para a operação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "409": {
          description: "Conflito (categoria núcleo ausente, nome duplicado, etc.).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/portal-config/statuses": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar status do ciclo do portal",
      description:
        "Substitui a lista completa de status do ciclo de forma atômica. Statuses de núcleo são imutáveis. Exige a permissão `status:manage`.",
      operationId: "updatePortalStatuses",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PortalStatusesPatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Status alterados com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["statuses"],
                properties: {
                  statuses: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PortalStatus" },
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Body inválido.",
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
          description: "Sem a permissão exigida para a operação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "409": {
          description: "Conflito (status núcleo faltando, renomeado, desativado, etc.).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/portal-config/prioritization-weights": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar pesos de priorização",
      description:
        "Altera os pesos (inteiro 1–10) de todos os critérios de priorização de forma atômica. Exige a permissão `prioritization_config:manage`.",
      operationId: "updatePortalPrioritizationWeights",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PortalPrioritizationWeightsPatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Pesos alterados com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prioritizationWeights"],
                properties: {
                  prioritizationWeights: {
                    $ref: "#/components/schemas/PrioritizationWeights",
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Body inválido.",
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
          description: "Sem a permissão exigida para a operação.",
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
