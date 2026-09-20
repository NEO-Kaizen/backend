import { app } from "./app.ts";
import Config from "./configs.ts";
import { ensureDefaultAssets } from "./shared/utils/ensureDefaultAssets.ts";

const PORT = Config.PORT;

// Ensure default portal assets exist in uploads/portal (no volume persistence, copy defaults)
await ensureDefaultAssets().catch((e) => console.warn("[assets] ensureDefaultAssets failed", e));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
