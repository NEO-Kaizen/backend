import { afterAll, describe, expect, it } from "vitest";
import knex from "knex";
import {
  applyQueueFilters,
  type QueueRepositoryFilters,
} from "../../src/modules/queue/queue.filters.ts";

/**
 * Usa o query builder real do Knex (sem conexão) para validar o SQL gerado.
 * Assim o teste verifica comportamento (condições aplicadas) em vez de fixar
 * a ordem exata das chamadas encadeadas no fake.
 */
const db = knex({ client: "pg" });

function build(filters: QueueRepositoryFilters) {
  const query = db("requests as requests");
  applyQueueFilters(query, filters);
  const { sql, bindings } = query.toSQL();

  return { sql, bindings };
}

afterAll(async () => {
  await db.destroy();
});

describe("applyQueueFilters", () => {
  it("sem filtros, não aplica nenhuma condição", () => {
    const { sql, bindings } = build({});

    expect(sql).not.toContain("where");
    expect(bindings).toEqual([]);
  });

  it("search aplica ILIKE em protocolo, e-mail e nome do requester", () => {
    const { sql, bindings } = build({ search: "MAAT" });

    expect(sql).toContain('"requests"."protocol" ilike ?');
    expect(sql).toContain('"requester"."corporate_email" ilike ?');
    expect(sql).toContain('"requester"."full_name" ilike ?');
    expect(bindings).toEqual(["%MAAT%", "%MAAT%", "%MAAT%"]);
  });

  it("status e priority filtram pelas tabelas corretas", () => {
    const status = build({ status: "Em triagem" });
    expect(status.sql).toContain('"status"."name" = ?');
    expect(status.bindings).toEqual(["Em triagem"]);

    const priority = build({ priority: "Alta" });
    expect(priority.sql).toContain('"priority_tbl"."level" = ?');
    expect(priority.bindings).toEqual(["Alta"]);
  });

  it('priority "nenhum" usa IS NULL em requests.priority_id', () => {
    const { sql } = build({ priority: "nenhum" });

    expect(sql).toContain('"requests"."priority_id" is null');
  });

  it("assigneeId numérico filtra por user_id; UUID por professional_id", () => {
    const numeric = build({ assigneeId: "20" });
    expect(numeric.sql).toContain('"assignee_user"."user_id" = ?');
    expect(numeric.bindings).toEqual([20]);

    const uuid = "6f3a0c8e-1b2d-4f5a-9c7e-8d1a2b3c4d5e";
    const professional = build({ assigneeId: uuid });
    expect(professional.sql).toContain('"requests"."professional_id" = ?');
    expect(professional.bindings).toEqual([uuid]);
  });

  it("unassigned tem precedência sobre um assigneeId numérico", () => {
    const { sql, bindings } = build({ unassigned: true, assigneeId: "20" });

    expect(sql).toContain('"requests"."professional_id" is null');
    expect(sql).not.toContain('"assignee_user"."user_id"');
    expect(bindings).toEqual([]);
  });

  it('assigneeId "unassigned" também representa ausência de responsável', () => {
    const { sql } = build({ assigneeId: "unassigned" });

    expect(sql).toContain('"requests"."professional_id" is null');
    expect(sql).not.toContain('"assignee_user"."user_id"');
  });

  it("scopedUserId restringe ao responsável (assignee OU mapping)", () => {
    const { sql, bindings } = build({ scopedUserId: 7 });

    expect(sql).toContain('"assignee_user"."user_id" = ?');
    expect(sql).toContain('"mapping_assignee"."user_id" = ?');
    expect(bindings).toEqual([7, 7]);
  });
});
