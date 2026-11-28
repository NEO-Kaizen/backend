import { error } from "../components/responses.ts";

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
        "400": error("Body inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
  },
  "/portal-config/identity": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar identidade do portal",
      description:
        "Altera o nome da plataforma (`platformName`) e/ou a máscara do protocolo (`protocolMask`). Exige perfil `Administrador`.",
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
                required: ["platformName", "protocolMask"],
                properties: {
                  platformName: { type: "string", example: "MAAT" },
                  protocolMask: { type: "string", example: "MAAT" },
                },
              },
            },
          },
        },
        "400": error("Body inválido (informe ao menos um campo)."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
  },
  "/portal-config/theme": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar Aparência do portal",
      description:
        "Altera a Aparência completa (light/dark) de forma atômica. Exige perfil `Administrador`.",
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
          description: "Aparência alterada com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["theme"],
                properties: { theme: { $ref: "#/components/schemas/PortalTheme" } },
              },
            },
          },
        },
        "400": error("Body inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
  },
  "/portal-config/assets": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar assets do portal",
      description:
        "Altera assets (logo, avatar, login image, favicon em claro/escuro) via multipart/form-data. Aceita JSON na parte `assets` e/ou arquivos binários. Exige perfil `Administrador`.",
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
              schema: {
                type: "object",
                required: ["assets"],
                properties: { assets: { $ref: "#/components/schemas/PortalAssets" } },
              },
            },
          },
        },
        "400": error("Body inválido, JSON malformado ou nenhum asset informado."),
        "413": error("Arquivo excede o limite de tamanho da chave."),
        "415": error("MIME/extensão não permitido para a chave."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
  },
  "/portal-config/categories": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar categorias do portal",
      description:
        "Substitui a lista completa de categorias de forma atômica. `isPubliclyListable` é obrigatório em cada item e controla a elegibilidade da Categoria para o corpus de duplicidade: alterná-lo suprime ou republica, na mesma transação, as projeções das Solicitações da Categoria. Exige perfil `Administrador`.",
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
        "400": error("Body inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
  },
  "/portal-config/statuses": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar status do ciclo do portal",
      description:
        "Substitui a lista completa de status do ciclo de forma atômica. Statuses de núcleo são imutáveis, incluindo `isDuplicateCorpusEligible` (o 16 permanece ligado e o 17 desligado). `isDuplicateCorpusEligible` é obrigatório em cada item: alterná-lo suprime ou republica, na mesma transação, as projeções das Solicitações do Status. Exige perfil `Administrador`.",
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
        "400": error("Body inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
        "409": error(
          "Violação de Status core. Códigos estáveis: `core_status_missing`, `core_status_removed`, `core_status_renamed`, `core_status_forced`, `core_status_forced_inactive`, `core_status_locked`, `core_status_corpus_eligibility_locked`.",
        ),
      },
    },
  },
  "/portal-config/prioritization-weights": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar pesos de priorização",
      description:
        "Altera os pesos (inteiro 1–10) de todos os critérios de priorização de forma atômica. Exige perfil `Administrador`.",
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
        "400": error("Body inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
  },
  "/portal-config/duplicates": {
    patch: {
      tags: ["Configuração do portal"],
      summary: "Alterar configuração de detecção de duplicidade",
      description:
        "Altera a flag de detecção de duplicidade e a janela de conclusão (1..36 meses) de forma atômica e auditada. Com a flag desligada, `POST /requests/duplicates/check` responde vazio e o índice não é construído. Exige perfil `Administrador`.",
      operationId: "updatePortalDuplicateDetection",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/DuplicateDetectionPatchBody" },
          },
        },
      },
      responses: {
        "200": {
          description: "Configuração de detecção de duplicidade alterada com sucesso.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["enabled", "completedWindowMonths"],
                properties: {
                  enabled: {
                    type: "boolean",
                    description: "Flag de detecção de duplicidade.",
                  },
                  completedWindowMonths: {
                    type: "integer",
                    description: "Janela de conclusão em meses (1..36). Padrão 3 meses.",
                  },
                },
              },
            },
          },
        },
        "400": error("Body inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (apenas Administrador)."),
      },
    },
  },
};
