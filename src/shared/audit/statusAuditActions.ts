/**
 * Ações de Auditoria que podem alterar o Status de uma Solicitação.
 *
 * Fonte única para o replay do backfill de `concluded_at` (issue #210) e para
 * qualquer leitura que precise reconhecer uma transição de Status.
 */
export const STATUS_AUDIT_ACTIONS = [
  "request.status_change",
  "request.override_status_admin",
  "request.triage",
] as const;

export type StatusAuditAction = (typeof STATUS_AUDIT_ACTIONS)[number];

export function isStatusAuditAction(value: unknown): value is StatusAuditAction {
  return STATUS_AUDIT_ACTIONS.some((action) => action === value);
}
