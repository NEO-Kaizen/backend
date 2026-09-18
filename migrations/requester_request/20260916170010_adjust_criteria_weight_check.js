/**
 * Alinha o domínio de `criteria.weight` com a decisão de produto issue-59 §8.3:
 * pesos inteiros **0–10** (diverge do contrato que pede 1.0–5.0). O CHECK
 * original (`weight > 0`) rejeitaria o peso mínimo 0 aceito pelo PATCH
 * `/portal-config/prioritization-weights` na mesma operação de escrita.
 */
export async function up(knex) {
  await knex.raw(`ALTER TABLE criteria DROP CONSTRAINT ck_criteria_weight_positive`);
  await knex.raw(
    `ALTER TABLE criteria ADD CONSTRAINT ck_criteria_weight_range CHECK (weight >= 0 AND weight <= 10)`,
  );
}

export async function down(knex) {
  await knex.raw(`ALTER TABLE criteria DROP CONSTRAINT ck_criteria_weight_range`);
  await knex.raw(
    `ALTER TABLE criteria ADD CONSTRAINT ck_criteria_weight_positive CHECK (weight > 0)`,
  );
}
