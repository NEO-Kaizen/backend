import authPaths from "./auth.ts";
import requestsPaths from "./requests.ts";
import usersPaths from "./users.ts";
import queuePaths from "./queue.ts";
import portalConfigPaths from "./portalConfig.ts";
import prioritizationPaths from "./prioritization.ts";
import reportsPaths from "./reports.ts";
import auditHistoryPaths from "./auditHistory.ts";
import internalNotesPaths from "./internalNotes.ts";
import pendingItemsPaths from "./pendingItems.ts";

export const paths = {
  ...authPaths,
  ...requestsPaths,
  ...usersPaths,
  ...queuePaths,
  ...portalConfigPaths,
  ...prioritizationPaths,
  ...reportsPaths,
  ...auditHistoryPaths,
  ...internalNotesPaths,
  ...pendingItemsPaths,
} as const;
