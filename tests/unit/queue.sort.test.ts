import { afterAll, describe, expect, it } from "vitest";
import knex from "knex";
import { applyQueueSort } from "../../src/modules/queue/queue.sort.ts";

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

    expect(sql).toContain('order by "requests"."created_at" desc, "requests"."protocol" asc');
    expect(bindings).toEqual([]);
  });

  it("aplica a direção recebida ao campo escolhido", () => {
    const { sql } = build("requesterName", "asc");

    expect(sql).toContain('order by "requester"."full_name" asc, "requests"."protocol" asc');
  });

  it("não repete o desempate quando o próprio protocolo é o campo ordenado", () => {
    const { sql } = build("protocol", "desc");

    expect(sql).toContain('order by "requests"."protocol" desc');
    expect(sql).not.toContain('protocol" asc');
  });

  it("traduz todos os campos permitidos sem aceitar SQL arbitrário", () => {
    expect(build("status").sql).toContain('"status"."name" desc');
    expect(build("priority", "asc").sql).toContain('"priority_tbl"."level" asc');
    expect(build("assignee").sql).toContain('"assignee_user"."full_name" desc');
  });
});
