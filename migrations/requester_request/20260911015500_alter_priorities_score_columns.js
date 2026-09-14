/**
 * Alinha a tabela `priorities` ao score normalizado 10–50 (RN-007, issue-51).
 *
 * 1. Converte min_score/max_score para DECIMAL(4,1) (ajuste original da branch);
 * 2. Redefine as faixas RN-008 na escala 10–50, contíguas e sem lacunas após
 *    arredondamento a 1 casa decimal:
 *      Baixa   10.0–20.0
 *      Média   20.1–30.0
 *      Alta    30.1–40.0
 *      Crítica 40.1–50.0
 */
export async function up(knex) {
  await knex.schema.alterTable("priorities", (table) => {
    table.decimal("min_score", 4, 1).notNullable().alter();
    table.decimal("max_score", 4, 1).notNullable().alter();
  });

  const faixas = [
    { priority_id: 1, level: "Baixa", min_score: 10.0, max_score: 20.0 },
    { priority_id: 2, level: "Média", min_score: 20.1, max_score: 30.0 },
    { priority_id: 3, level: "Alta", min_score: 30.1, max_score: 40.0 },
    { priority_id: 4, level: "Crítica", min_score: 40.1, max_score: 50.0 },
  ];

  for (const faixa of faixas) {
    await knex("priorities")
      .where({ priority_id: faixa.priority_id })
      .update({ min_score: faixa.min_score, max_score: faixa.max_score });
  }
}

export async function down(knex) {
  await knex.schema.alterTable("priorities", (table) => {
    table.integer("min_score").notNullable().alter();
    table.integer("max_score").notNullable().alter();
  });
}