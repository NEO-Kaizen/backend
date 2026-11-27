/**
 * RF16 (issue #210) — liga o Status 16 (Concluído) na allowlist do corpus.
 *
 * A issue #209 desligou os desfechos 10, 13, 16, 17 e 19. A partir da #210, o
 * 16 passa a alimentar o corpus de concluídas com texto tarjado, respeitando a
 * janela configurável. Os demais desfechos continuam desligados pela migration
 * da #209; religá-los ou não é escopo da #212.
 *
 * A issue #212 deve considerar o 16 ligado ao editar a allowlist e republicar
 * as concluídas quando a janela AUMENTAR.
 *
 * Regras em `docs/rules/duplicate-detection.md`.
 */
const COMPLETED_STATUS_ID = 16;

export async function up(knex) {
  await knex("statuses")
    .where({ status_id: COMPLETED_STATUS_ID })
    .update({ is_duplicate_corpus_eligible: true });
}

export async function down(knex) {
  await knex("statuses")
    .where({ status_id: COMPLETED_STATUS_ID })
    .update({ is_duplicate_corpus_eligible: false });
}
