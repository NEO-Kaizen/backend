import type { SolicitationMode } from "./portalConfig.ts";

/** Modo de abertura do portal — `solicitation_mode` do contrato. */
export type PortalSolicitationMode = SolicitationMode;

/**
 * Intervalo e padrão da janela do corpus de concluídas (issue #210). O CHECK da
 * migration `20261126120100_add_duplicate_completed_window.js` mantém o mesmo
 * intervalo fixo no banco; estes valores são o default da leitura.
 */
export const DUPLICATE_COMPLETED_WINDOW_MONTHS = {
  min: 1,
  max: 36,
  default: 3,
} as const;

/**
 * Janela do corpus de concluídas já validada contra o intervalo do banco.
 * Carregar o valor como tipo de domínio evita que um `number` qualquer
 * atravesse publicação, varredura e backfill sem passar pela validação.
 */
export interface DuplicateCompletedWindow {
  readonly months: number;
}

export const DEFAULT_DUPLICATE_COMPLETED_WINDOW: DuplicateCompletedWindow = {
  months: DUPLICATE_COMPLETED_WINDOW_MONTHS.default,
};

/** Converte o valor lido do banco para a janela; `null` quando inválido. */
export function parseDuplicateCompletedWindow(value: unknown): DuplicateCompletedWindow | null {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < DUPLICATE_COMPLETED_WINDOW_MONTHS.min ||
    value > DUPLICATE_COMPLETED_WINDOW_MONTHS.max
  ) {
    return null;
  }

  return { months: value };
}

export type DuplicateCompletedWindowFallbackWarner = (message: string) => void;

/**
 * Cria um aviso de fallback que dispara no máximo uma vez por processo. O
 * estado fica encapsulado na closure e pode ser injetado em testes.
 */
export function createDuplicateCompletedWindowFallbackWarner(
  warn: DuplicateCompletedWindowFallbackWarner,
): DuplicateCompletedWindowFallbackWarner {
  let hasWarned = false;

  return (message) => {
    if (hasWarned) return;
    hasWarned = true;
    warn(message);
  };
}

/**
 * Linha da tabela `system_settings` — configuração global singleton (regras em
 * `docs/rules/portal-config.md`).
 *
 * Retorno direto do Knex (colunas em snake_case, datas normalizadas pelo
 * PostgreSQL). O singleton é garantido no banco: `settings_id = 1` (PK + CHECK).
 *
 * Mantém APENAS o que não vive em tabela própria:
 * - identity (`platform_name`/`protocol_mask`) e access (`solicitation_mode`);
 * - temas: FK `theme_id` → `system_themes` (ver `SystemThemeRow`);
 * - assets (8 variantes claro/escuro + flag `logo_use_primary_color`);
 * - `categories`, `statuses` e `prioritizationWeights` ficam nas tabelas
 *   próprias (`categories`, `statuses`, `criteria`).
 */
export interface SystemSettingsRow {
  settings_id: number;
  platform_name: string;
  solicitation_mode: SolicitationMode;
  protocol_mask: string;
  duplicate_detection_enabled: boolean;
  duplicate_completed_window_months: number;
  theme_id: number | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  logo_use_primary_color: boolean;
  avatar_light_url: string | null;
  avatar_dark_url: string | null;
  login_image_light_url: string | null;
  login_image_dark_url: string | null;
  favicon_light_url: string | null;
  favicon_dark_url: string | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date | null;
}
