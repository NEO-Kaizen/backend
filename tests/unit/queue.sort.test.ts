import { afterAll, describe, expect, it } from "vitest";
import knex from "knex";
import { applyQueueSort } from "../../src/modules/queue/queue.sort.ts";
import { QUEUE_SORT_BY } from "../../src/shared/types/queue.types.ts";

const db = knex({ client: "pg" });

function build(
  sortBy?: Parameters<typeof applyQueueSort>[1],
  sortOrder?: Parameters<typeof applyQueueSort>[2],
) {
  const query = db("requests as requests");
  applyQueueSort(query, sortBy, sortOrder);
  return query.toSQL();
}

afterAll(async () => {
  await db.destroy();
});

describe("applyQueueSort", () => {
  it("mantém created_at desc como padrão e desempata por protocolo", () => {
    const { sql, bindings } = build();

    expect(sql).toContain(
      'order by "requests"."created_at" desc nulls last, lower("requests"."protocol") asc',
    );
    expect(bindings).toEqual([]);
  });

  it("aplica a direção recebida ao campo escolhido", () => {
    const { sql } = build("status", "asc");

    expect(sql).toContain('"status"."order_number" asc nulls last');
    expect(sql).toContain('lower("requests"."protocol") asc');
  });

  it("compara protocolo sem diferenciar maiúsculas e sem repetir o desempate", () => {
    const { sql } = build("protocol", "desc");

    expect(sql).toContain('order by lower("requests"."protocol") desc nulls last');
    expect(sql).not.toContain('"requests"."protocol" desc');
    expect(sql.match(/lower\("requests"\."protocol"\)/g)).toHaveLength(1);
  });

  it("ordena status pela ordem do ciclo de vida e prioridade pela gravidade", () => {
    expect(build("status").sql).toContain('"status"."order_number" desc nulls last');
    expect(build("priority", "asc").sql).toContain('"requests"."priority_id" asc nulls last');
    expect(build("priority", "desc").sql).toContain('"requests"."priority_id" desc nulls last');
  });

  it("mantém nulos no fim em ambas as direções", () => {
    expect(build("protocol", "asc").sql).toContain('lower("requests"."protocol") asc nulls last');
    expect(build("priority", "asc").sql).toContain('"requests"."priority_id" asc nulls last');
    expect(build("priority", "desc").sql).toContain('"requests"."priority_id" desc nulls last');
  });

  it("traduz todos os campos permitidos sem aceitar SQL arbitrário", () => {
    expect(QUEUE_SORT_BY).toEqual(["createdAt", "protocol", "status", "priority"]);

    for (const sortBy of QUEUE_SORT_BY) {
      expect(() => build(sortBy)).not.toThrow();
    }
  });
});
