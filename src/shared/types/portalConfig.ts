import type { StatusTone } from "./systemTheme.ts";

/**
 * Espelho do contrato `portal-config-api.md` (issue #90) — tipos de domínio da
 * configuração do portal, mantendo a mesma nomenclatura (camelCase em inglês).
 *
 * Reutiliza `StatusTone` (e, indiretamente, `STATUS_TONES`) de `systemTheme.ts`
 * para não haver drift entre o tema (DB) e a API. `THEME_TOKEN_KEYS` aqui é o
 * espelho do contrato (camelCase); a forma snake_case das colunas do banco vive
 * em `SystemThemeRow`/`systemTheme.ts` e é ponteada pelos mappers.
 */

// Modo de acesso ao formulário de solicitação.
export type SolicitationMode = "PUBLIC" | "AUTHENTICATED";

// Assets do portal — URLs de imagem (relativa do próprio app ou http(s)), em
// par claro/escuro, mais o flag de apresentação do logo. `*DarkUrl` vazio cai
// para a variante clara (contrato `portal-config-api2.md` §tipos).
export interface PortalAssets {
  logoLightUrl: string;
  logoDarkUrl: string;
  // Quando true, o logo (SVG) é renderizado monocromático na cor primária.
  logoUsePrimaryColor: boolean;
  avatarLightUrl: string;
  avatarDarkUrl: string;
  loginImageLightUrl: string;
  loginImageDarkUrl: string;
  faviconLightUrl: string;
  faviconDarkUrl: string;
}

// Chaves de URL de asset (sem a flag — o flag é booleano separado no patch).
export const ASSET_KEYS = [
  "logoLightUrl",
  "logoDarkUrl",
  "avatarLightUrl",
  "avatarDarkUrl",
  "loginImageLightUrl",
  "loginImageDarkUrl",
  "faviconLightUrl",
  "faviconDarkUrl",
] as const;

export type AssetKey = (typeof ASSET_KEYS)[number];

// Atualização parcial de assets do card: apenas as chaves alteradas (URLs) +
// o flag opcional de cor primária do logo.
export type PortalAssetsPatch = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};

export type { StatusTone };

// Tokens de cor da paleta — allowlist do contrato, em camelCase.
export const THEME_TOKEN_KEYS = [
  "background",
  "surface",
  "border",
  "textPrimary",
  "textSecondary",
  // Cor dos títulos (h1–h6). Default = `primary` da paleta, mas configurável
  // para permitir títulos neutros com a marca reservada a CTAs/links.
  "heading",
  "richBlack",
  "primary",
  "secondary",
  "tint",
  "onPrimary",
  "onDark",
  "onGradient",
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

// Cores de um tom (modelo monocromático): acento (`color`) e fundo
// (`background`). `backgroundLocked` indica fundo manual/travado.
export interface StatusToneTokens {
  color: string;
  background: string;
  backgroundLocked: boolean;
}

// Gradiente de superfícies de destaque (hero/banner).
export interface ThemeGradient {
  from: string; // hex #RRGGBB / #RRGGBBAA
  to: string; // hex #RRGGBB / #RRGGBBAA
  angle?: number; // graus 0..360 (default 143 quando ausente)
}

// Combina os 13 tokens + `gradient` + `statuses` da paleta. A ordem de
// serialização é relevante para a comparação de rascunho no cliente: `gradient`
// é emitido antes de `statuses` (contrato `portal-config-api-0_4.md`).
export interface ThemeTokens extends Record<ThemeTokenKey, string> {
  gradient: ThemeGradient;
  statuses: Record<StatusTone, StatusToneTokens>;
}

// Paletas do portal — claro e escuro.
export interface PortalTheme {
  light: ThemeTokens;
  dark: ThemeTokens;
}

// Categoria da demanda. `id` é a chave estável; em itens novos é gerado pelo
// cliente (maior id atual + 1) e aceito pelo backend. A ordem do array é a
// ordem de exibição.
export interface PortalCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

// Visibilidade de um status: PUBLIC aparece ao solicitante; INTERNAL fica
// restrito à equipe.
export type StatusVisibility = "PUBLIC" | "INTERNAL";

/**
 * Modo de uso de um status nos fluxos de triagem/mapeamento (Motor de Status
 * v4 — delta `portal-config-statuses-amend.md`):
 * - `none`: nunca é alvo direto da etapa (ex.: transição de N para Concluído);
 * - `free`: pode ser alvo livremente pelo agente da etapa;
 * - `conclusion_only`: alvo apenas na etapa de conclusão (ex.: Concluído).
 */
export type StatusMode = "none" | "free" | "conclusion_only";

/**
 * Status do ciclo de vida — Motor de Status v4. `order` é a posição de
 * exibição (mantida consistente pela ordem do array no PATCH). `isCore` marca
 * statuses de núcleo (ids fixos 1,3,4,7,16,17 — não podem ser removidos,
 * renomeados, não-núcleo ou desativados). `isRestricted` limita o status a
 * Administrador (ex.: Priorizado). `isTerminal` encerra a solicitação.
 * `isPublic` controla a exibição ao solicitante (mapeia para `visibility`).
 * `triageMode`/`mappingMode` regem os alvos da triagem e do mapeamento.
 */
export interface PortalStatus {
  id: number;
  name: string;
  order: number;
  isCore: boolean;
  isPublic: boolean;
  isTerminal: boolean;
  triageMode: StatusMode;
  mappingMode: StatusMode;
  isRestricted: boolean;
  tone: StatusTone;
  isActive: boolean;
}

// Critérios fixos de priorização (allowlist das chaves aceitas).
export const PRIORITIZATION_CRITERIA = [
  "operationalImpact",
  "operationalRisk",
  "urgency",
  "volumetry",
  "manualEffort",
  "clientImpact",
  "regulatoryDeadline",
  "affectedAreas",
  "strategicAlignment",
  "estimatedComplexity",
] as const;

export type PrioritizationCriterion = (typeof PRIORITIZATION_CRITERIA)[number];

// Pesos da priorização — objeto completo, sempre com todas as chaves. Escala
// **inteira 1–10** (alinhada ao contrato `portal-config-api-0_4.md` e ao
// `criteria.weight`).
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;

// Config completa (GET) e recortes de cada seção editável.
export interface PortalConfig {
  platformName: string;
  solicitationMode: SolicitationMode;
  protocolMask: string;
  theme: PortalTheme;
  assets: PortalAssets;
  categories: PortalCategory[];
  statuses: PortalStatus[];
  prioritizationWeights: PrioritizationWeights;
}

export type AccessSection = Pick<PortalConfig, "solicitationMode">;
export type IdentitySection = Pick<PortalConfig, "platformName" | "protocolMask">;
export type ThemeSection = Pick<PortalConfig, "theme">;
export type AssetsSection = Pick<PortalConfig, "assets">;
export type CategoriesSection = Pick<PortalConfig, "categories">;
export type StatusesSection = Pick<PortalConfig, "statuses">;
export type PrioritizationWeightsSection = Pick<PortalConfig, "prioritizationWeights">;

/** Linha da tabela `categories` — projeção usada pelo portal config. */
export interface CategoryRow {
  category_id: number;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  display_order: number | null;
}

/** Linha da tabela `statuses` — projeção usada pelo portal config (v4). */
export interface StatusRow {
  status_id: number;
  name: string;
  visibility: StatusVisibility;
  closes_request: boolean;
  is_final: boolean;
  is_triage_exit: boolean;
  is_core: boolean;
  is_restricted: boolean;
  is_terminal: boolean;
  triage_mode: StatusMode;
  mapping_mode: StatusMode;
  tone: StatusTone;
  order_number: number;
  is_active: boolean;
}
