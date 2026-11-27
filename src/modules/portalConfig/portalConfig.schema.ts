import { z } from "zod";
import {
  CORE_STATUS_IDS,
  PRIORITIZATION_CRITERIA,
  THEME_TOKEN_KEYS,
  type ThemeTokenKey,
} from "../../shared/types/portalConfig.ts";
import { STATUS_TONES, type StatusTone } from "../../shared/types/systemTheme.ts";

/**
 * Schemas por seção do `PATCH /portal-config/*` (contrato `portal-config-api.md`).
 * Espelham as validações do contrato por Card; escala de pesos **inteira 1–10**
 * (portal-config-api-0_4.md, alinhada a `criteria.weight`; a migration de CHECK
 * do banco aceita 0–10 por decisão de produto issue-59 §8.3).
 */

/** Hex #RRGGBB ou #RRGGBBAA. */
export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, "Cor inválida — use #RRGGBB ou #RRGGBBAA.");

const ThemeGradientSchema = z
  .object({
    from: hexColorSchema,
    to: hexColorSchema,
    angle: z
      .number()
      .int("Ângulo deve ser inteiro.")
      .min(0, "Ângulo mínimo de 0.")
      .max(360, "Ângulo máximo de 360.")
      .optional(),
  })
  .strict();

const StatusToneSchema = z
  .object({
    color: hexColorSchema,
    background: hexColorSchema,
    backgroundLocked: z.boolean(),
  })
  .strict();

const statusTonesShape = Object.fromEntries(
  STATUS_TONES.map((tone) => [tone, StatusToneSchema]),
) as Record<StatusTone, typeof StatusToneSchema>;

const tokenShape = Object.fromEntries(
  THEME_TOKEN_KEYS.map((key) => [key, hexColorSchema]),
) as Record<ThemeTokenKey, typeof hexColorSchema>;

const ThemePaletteSchema = z
  .object({
    ...tokenShape,
    gradient: ThemeGradientSchema,
    statuses: z.object(statusTonesShape).strict(),
  })
  .strict();

export const updateThemeSchema = z
  .object({
    theme: z
      .object({
        light: ThemePaletteSchema,
        dark: ThemePaletteSchema,
      })
      .strict(),
  })
  .strict();

export const updateAccessSchema = z
  .object({
    solicitationMode: z.enum(["PUBLIC", "AUTHENTICATED"], {
      error: "Modo de acesso inválido — opções: PUBLIC ou AUTHENTICATED.",
    }),
  })
  .strict();

export const updateIdentitySchema = z
  .object({
    platformName: z
      .string()
      .trim()
      .min(1, "Campo obrigatório.")
      .max(80, "Máximo de 80 caracteres.")
      .optional(),
    protocolMask: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]+$/, "Máscara do protocolo deve conter apenas letras e números.")
      .max(10, "Máximo de 10 caracteres.")
      .optional(),
  })
  .strict()
  .refine(
    (identity) => identity.platformName !== undefined || identity.protocolMask !== undefined,
    {
      message: "Informe ao menos um campo.",
      path: ["platformName"],
    },
  );

export const portalCategorySchema = z
  .object({
    id: z.number().int("Id deve ser inteiro.").positive("Id deve ser positivo."),
    name: z.string().trim().min(1, "Campo obrigatório.").max(40, "Máximo de 40 caracteres."),
    description: z.string().max(200, "Máximo de 200 caracteres."),
    isActive: z.boolean(),
  })
  .strict();

export const updateCategoriesSchema = z
  .object({
    categories: z
      .array(portalCategorySchema)
      .min(1, "Informe ao menos uma categoria.")
      .max(50, "Máximo de 50 categorias.")
      .superRefine((categories, ctx) => {
        const seen = new Set<string>();
        categories.forEach((category, index) => {
          const key = category.name.trim().toLowerCase();
          if (seen.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, "name"],
              message: "Nomes de categorias devem ser únicos (ignora maiúsculas/minúsculas).",
            });
          }
          seen.add(key);
        });
        if (!categories.some((category) => category.isActive)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["categories"],
            message: "Ao menos uma categoria deve estar ativa.",
          });
        }
      }),
  })
  .strict();

const StatusModeSchema = z.enum(["none", "free", "conclusion_only"], {
  error: "Modo inválido — opções: none, free ou conclusion_only.",
});

export const portalStatusSchema = z
  .object({
    id: z
      .number()
      .int("Id deve ser inteiro.")
      .min(1, "Id mínimo de 1.")
      .max(50, "Id máximo de 50."),
    name: z.string().trim().min(1, "Campo obrigatório.").max(40, "Máximo de 40 caracteres."),
    isCore: z.boolean(),
    isPublic: z.boolean(),
    isTerminal: z.boolean(),
    triageMode: StatusModeSchema,
    mappingMode: StatusModeSchema,
    isRestricted: z.boolean(),
    tone: z.enum(STATUS_TONES, {
      error: "Tom inválido — opções: error, success, info, warning ou neutral.",
    }),
    isActive: z.boolean(),
  })
  .strict()
  .superRefine((status, ctx) => {
    if (status.isCore && !(CORE_STATUS_IDS as readonly number[]).includes(status.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isCore"],
        message: "isCore só é permitido nos status de núcleo (ids 1, 3, 4, 6, 7, 16, 17).",
      });
    }
  });

export const updateStatusesSchema = z
  .object({
    statuses: z
      .array(portalStatusSchema)
      .min(1, "Informe ao menos um status.")
      .max(50, "Máximo de 50 status.")
      .superRefine((statuses, ctx) => {
        const seenNames = new Set<string>();
        statuses.forEach((status, index) => {
          const nameKey = status.name.trim().toLowerCase();
          if (seenNames.has(nameKey)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, "name"],
              message: "Nomes de status devem ser únicos (ignora maiúsculas/minúsculas).",
            });
          }
          seenNames.add(nameKey);

          if (status.isCore && !status.isActive) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, "isActive"],
              message: "Os statuses núcleo não podem ser desativados.",
            });
          }
          if (
            status.isRestricted &&
            (status.triageMode !== "none" || status.mappingMode !== "none")
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, "isRestricted"],
              message: "Status restrito só aceita modos none (bloqueia triagem e mapeamento).",
            });
          }
        });
        if (!statuses.some((status) => status.isActive)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["statuses"],
            message: "Ao menos um status deve estar ativo.",
          });
        }
      }),
  })
  .strict();

/**
 * Pesos da priorização — objeto atômico completo, sempre com todas as chaves.
 * Escala **inteira 1–10** (contrato `portal-config-api-0_4.md`, alinhada ao
 * `criteria.weight`).
 */
const prioritizationWeightSchema = z
  .number()
  .int("Peso deve ser inteiro.")
  .min(1, "Peso mínimo de 1.")
  .max(10, "Peso máximo de 10.");

export const updatePrioritizationWeightsSchema = z
  .object({
    prioritizationWeights: z.record(
      z.enum(PRIORITIZATION_CRITERIA, { error: "Critério desconhecido." }),
      prioritizationWeightSchema,
    ),
  })
  .strict()
  .superRefine(({ prioritizationWeights }, ctx) => {
    const missing = PRIORITIZATION_CRITERIA.filter(
      (criterion) => prioritizationWeights[criterion] === undefined,
    );
    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prioritizationWeights"],
        message: `Critérios obrigatórios ausentes: ${missing.join(", ")}.`,
      });
    }
  });

/**
 * Parte JSON `assets` do multipart (chaves com URL definida diretamente).
 * Aceita URL relativa do app (`/...`) ou `http(s)://`; rejeita esquemas como
 * `blob:`/`javascript:` (contrato `portal-config-api-0_4.md` §5 — `blob:` é
 * permitido apenas no preview local do frontend em dev).
 */
const assetUrlSchema = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .max(500, "Máximo de 500 caracteres.")
  .refine(
    (url) => url.startsWith("/") || /^https?:\/\//i.test(url),
    "URL de asset deve ser relativa do app ou http(s).",
  );

export const portalAssetsPatchSchema = z
  .object({
    logoLightUrl: assetUrlSchema,
    logoDarkUrl: assetUrlSchema,
    logoUsePrimaryColor: z.boolean(),
    avatarLightUrl: assetUrlSchema,
    avatarDarkUrl: assetUrlSchema,
    loginImageLightUrl: assetUrlSchema,
    loginImageDarkUrl: assetUrlSchema,
    faviconLightUrl: assetUrlSchema,
    faviconDarkUrl: assetUrlSchema,
  })
  .partial()
  .strict()
  .refine((assets) => Object.keys(assets).length > 0, {
    message: "Informe ao menos uma chave de asset.",
    path: ["assets"],
  });
