import { app } from "./app.ts";
import Config from "./configs.ts";
import { bootstrapDuplicateIndex } from "./modules/duplicates/bootstrap.ts";
import { ensureDefaultAssets } from "./shared/utils/ensureDefaultAssets.ts";

const PORT = Config.PORT;

// Ensure default portal assets exist in uploads/portal (no volume persistence, copy defaults)
await ensureDefaultAssets().catch((e) => console.warn("[assets] ensureDefaultAssets failed", e));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Índice de duplicidade: build fora do caminho da requisição, depois do
  // listen. Falha de build não derruba o servidor (issue #209).
  void bootstrapDuplicateIndex();
});
