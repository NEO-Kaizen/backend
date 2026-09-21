/**
 * Ativa os status de saída da triagem (`is_triage_exit = true`).
 *
 * A migration `20260920000000_add_triage_exit_to_statuses` inseriu os status
 * 18–22 sem `is_active` — que nasce com default `false` em
 * `20260916170000_add_is_active_to_statuses`. Como `resolveExitStatus` filtra
 * `is_active: true AND is_triage_exit: true`, os status novos ficavam
 * inalcançáveis. Este update garante que toda saída de triagem seja ativa
 * (idempotente por condição, também cobre status 1–17 já marcados).
 */
export async function up(knex) {
  await knex("statuses").where({ is_triage_exit: true }).update({ is_active: true });
}

export async function down(knex) {
  // Apenas os status de triagem introduzidos por
  // `20260920000000_add_triage_exit_to_statuses` voltam a ficar inativos;
  // os status 1–17 que já eram ativos permanecem como estavam.
  await knex("statuses")
    .whereIn("name", [
      "Elegível para avaliação",
      "Fora do escopo",
      "Direcionada para outra área",
      "Duplicada",
      "Cancelada",
    ])
    .update({ is_active: false });
}
