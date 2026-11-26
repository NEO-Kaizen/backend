/**
 * RF16 (issue #209) — liga a detecção de duplicidade no ambiente de
 * desenvolvimento para demonstração. Em produção a flag permanece `false`
 * até o canário de RN04 e a calibração da confiança (issue #213).
 *
 * Idempotente: apenas atualiza o singleton `system_settings`.
 */
export async function seed(knex) {
  await knex("system_settings")
    .where({ settings_id: 1 })
    .update({ duplicate_detection_enabled: true, updated_at: knex.fn.now() });
}
