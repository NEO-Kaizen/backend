/**
 * Torna `statuses.order_number` único porém DEFERRABLE INITIALLY DEFERRED.
 *
 * `PATCH /portal-config/statuses` renumera os status por `order_number = índice`
 * dentro de uma transação (`portalConfig.service.ts` → `upsertStatuses`). Com a
 * constraint imediata, mover/adicionar um item (ex.: novo status no início da
 * lista) colide com a linha que ainda ocupa aquele `order_number` antes de ser
 * renumerada, resultando em `23505 duplicate key uk_statuses_order`.
 *
 * Adiando a checagem para o COMMIT, a unicidade é validada apenas quando a
 * renumeração já terminou — comportamento correto para a lista atômica enviada
 * pela tela de configurações. Fora de transação (autocommit), a checagem deferida
 * ocorre ao fim do próprio statement, mantendo a garantia.
 *
 * A pkey `statuses_pkey` (`status_id`) permanece imediata e é a usada pelo
 * `ON CONFLICT (status_id)` do upsert; a FK de `requests.status_id` não é
 * afetada (referencia a pkey, não `order_number`).
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "statuses" DROP CONSTRAINT "uk_statuses_order"');
  await knex.raw(
    'ALTER TABLE "statuses" ADD CONSTRAINT "uk_statuses_order" UNIQUE ("order_number") DEFERRABLE INITIALLY DEFERRED',
  );
}

export async function down(knex) {
  await knex.raw('ALTER TABLE "statuses" DROP CONSTRAINT "uk_statuses_order"');
  await knex.raw(
    'ALTER TABLE "statuses" ADD CONSTRAINT "uk_statuses_order" UNIQUE ("order_number")',
  );
}
