/**
 * CHECKs de integridade das faixas RN-008 na tabela `priorities` (M2).
 *
 * Garante em banco que as faixas se mantêm na escala 10–50 (RN-007) e que
 * min <= max. A contiguidade estrita (10.0–20.0 / 20.1–30.0 / ...) continua
 * sendo responsabilidade do CRUD/seeds das faixas — registrar TODO lá se um
 * CRUD de faixas for criado.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    ALTER TABLE "priorities"
      ADD CONSTRAINT ck_priorities_min_score_range
        CHECK (min_score >= 10 AND min_score <= 50),
      ADD CONSTRAINT ck_priorities_max_score_range
        CHECK (max_score >= 10 AND max_score <= 50),
      ADD CONSTRAINT ck_priorities_min_le_max
        CHECK (min_score <= max_score);
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw(`
    ALTER TABLE "priorities"
      DROP CONSTRAINT ck_priorities_min_score_range,
      DROP CONSTRAINT ck_priorities_max_score_range,
      DROP CONSTRAINT ck_priorities_min_le_max;
  `);
}
