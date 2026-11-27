/**
 * Janela do corpus de concluídas (issue #210).
 *
 * O CHECK da migration `20261126120100_add_duplicate_completed_window.js`
 * mantém o mesmo intervalo fixo no banco; estes valores são o default da
 * leitura e o limite validado pelo parser.
 */
export const DUPLICATE_COMPLETED_WINDOW_MONTHS = {
  min: 1,
  max: 36,
  default: 3,
} as const;

declare const duplicateCompletedWindowBrand: unique symbol;

/**
 * Janela já validada contra o intervalo do banco. O brand impede que um
 * `{ months: 99 }` estrutural atravesse publicação, varredura e backfill sem
 * passar por `parseDuplicateCompletedWindow`.
 */
export interface DuplicateCompletedWindow {
  readonly months: number;
  readonly [duplicateCompletedWindowBrand]: true;
}

function createDuplicateCompletedWindow(months: number): DuplicateCompletedWindow {
  return Object.freeze({ months }) as DuplicateCompletedWindow;
}

export const DEFAULT_DUPLICATE_COMPLETED_WINDOW = createDuplicateCompletedWindow(
  DUPLICATE_COMPLETED_WINDOW_MONTHS.default,
);

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

  return createDuplicateCompletedWindow(value);
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
 * Warner de produção, compartilhado explicitamente pelos chamadores da
 * leitura da janela. Deixar de ser default da função mantém o efeito visível
 * na borda que escolhe avisar.
 */
export const warnDuplicateCompletedWindowFallback = createDuplicateCompletedWindowFallbackWarner(
  (message) => console.warn(message),
);
