import { auditCatalog } from "./auditCatalog.ts";

const requestStatusTransitionActions = [
  "request.status_change",
  "request.override_status_admin",
  "request.triage",
] as const satisfies readonly `${"request"}.${(typeof auditCatalog.request.actions)[number]}`[];

const requestStatusTransitionActionSet = new Set<string>(requestStatusTransitionActions);

export function isRequestStatusTransitionAction(actionType: string): boolean {
  return requestStatusTransitionActionSet.has(actionType);
}

export function parseAuditedStatusName(value: string | null | undefined): string | null {
  if (value == null) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "string") return parsed;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "status" in parsed &&
      typeof parsed.status === "string"
    ) {
      return parsed.status;
    }
    return null;
  } catch {
    return value;
  }
}
