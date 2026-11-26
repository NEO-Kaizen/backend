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

const dryRun = process.argv.includes("--dry-run");

/**
 * Loga a causa sem stack nem SQL cru. O relatório é a saída esperada do CLI;
 * a mensagem sanitizada só ajuda a diagnosticar a falha na borda.
 */
function describeFailure(error) {
  if (!(error instanceof Error)) return "erro desconhecido";

  const message = error.message.replace(/\s+/g, " ").trim();
  if (!message) return error.name;

  return message.length > 500 ? `${message.slice(0, 497)}...` : message;
}

try {
  const report = await backfillConcludedAt({ dryRun });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(`[backfill-concluded-at] falha ao executar o backfill (${describeFailure(error)})`);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
