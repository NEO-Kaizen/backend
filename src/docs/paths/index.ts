import authPaths from "./auth.ts";
import requestsPaths from "./requests.ts";
import usersPaths from "./users.ts";
import profilesPaths from "./profiles.ts";
import queuePaths from "./queue.ts";
import portalConfigPaths from "./portalConfig.ts";
import prioritizationPaths from "./prioritization.ts";
import reportsPaths from "./reports.ts";
import auditHistoryPaths from "./auditHistory.ts";
import internalNotesPaths from "./internalNotes.ts";
import pendingItemsPaths from "./pendingItems.ts";
import notificationsPaths from "./notifications.ts";

export const paths = {
  ...authPaths,
  ...requestsPaths,
  ...usersPaths,
  ...profilesPaths,
  ...queuePaths,
  ...portalConfigPaths,
  ...prioritizationPaths,
  ...reportsPaths,
  ...auditHistoryPaths,
  ...internalNotesPaths,
  ...pendingItemsPaths,
  ...notificationsPaths,
} as const;
