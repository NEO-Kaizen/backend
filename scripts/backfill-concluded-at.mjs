#!/usr/bin/env node
/**
 * RF16 (issue #210) — backfill de `requests.concluded_at` pela Auditoria.
 *
 * Uso:
 *   npm run backfill:concluded-at
 *   npm run backfill:concluded-at -- --dry-run
 *
 * O relatório é impresso em JSON. Concluídas sem evento de entrada vigente são
 * apenas relatadas, nunca recebem data por `updated_at` nem criam projeção.
 */
import db from "../src/database/conection.ts";
import { backfillConcludedAt } from "../src/modules/duplicates/backfillConcludedAt.ts";
import { describeFailure } from "../src/shared/utils/describeFailure.ts";

const dryRun = process.argv.includes("--dry-run");

try {
  const report = await backfillConcludedAt({ dryRun });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(`[backfill-concluded-at] falha ao executar o backfill (${describeFailure(error)})`);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
