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

    expect(sql).toContain(
      'order by "requests"."created_at" desc nulls last, "requests"."protocol" asc',
    );
    expect(bindings).toEqual([]);
  });

  it("aplica a direção recebida ao campo escolhido", () => {
    const { sql } = build("requesterName", "asc");

    expect(sql).toContain(
      'order by "requester"."full_name" asc nulls last, "requests"."protocol" asc',
    );
  });

  it("não repete o desempate quando o próprio protocolo é o campo ordenado", () => {
    const { sql } = build("protocol", "desc");

    expect(sql).toContain('order by "requests"."protocol" desc nulls last');
    expect(sql).not.toContain('protocol" asc');
  });

  it("ordena status pela ordem do ciclo de vida e prioridade pela gravidade", () => {
    expect(build("status").sql).toContain('"status"."order_number" desc nulls last');
    expect(build("priority", "asc").sql).toContain('"requests"."priority_id" asc nulls last');
    expect(build("priority", "desc").sql).toContain('"requests"."priority_id" desc nulls last');
  });

  it("mantém ausência de responsável no fim mesmo em ordem descendente", () => {
    expect(build("assignee").sql).toContain('"assignee_user"."full_name" desc nulls last');
  });

  it("traduz todos os campos permitidos sem aceitar SQL arbitrário", () => {
    const allowed = [
      "createdAt",
      "protocol",
      "requesterName",
      "status",
      "priority",
      "assignee",
    ] as const;

    for (const sortBy of allowed) {
      expect(() => build(sortBy)).not.toThrow();
    }
  });
});
