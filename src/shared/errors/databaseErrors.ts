/**
 * Erros do PostgreSQL que os serviços traduzem em recusas de negócio.
 *
 * O driver expõe `code`/`constraint` no próprio erro; comparar o SQLSTATE é mais
 * estável do que inspecionar a mensagem.
 */

/** Violação de unicidade (`unique_violation`) — índice único ou constraint. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "23505"
  );
}

/** Nome da constraint/índice que a `unique_violation` violou, quando informado. */
export function getUniqueViolationConstraint(error: unknown): string | undefined {
  return typeof error === "object" && error !== null
    ? (error as { constraint?: string }).constraint
    : undefined;
}
