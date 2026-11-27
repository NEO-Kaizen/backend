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

  it("search aplica ILIKE em todos os campos do contrato RF04", () => {
    const { sql, bindings } = build({ search: "MAAT" });

    expect(sql).toContain('"requests"."protocol" ilike ?');
    expect(sql).toContain('"requests"."title" ilike ?');
    expect(sql).toContain('"requests"."process_name" ilike ?');
    expect(sql).toContain('"requests"."need_description" ilike ?');
    expect(sql).toContain('"requests"."problem_opportunity" ilike ?');
    expect(sql).toContain('"requests"."expected_result" ilike ?');
    expect(sql).toContain('"requester"."corporate_email" ilike ?');
    expect(sql).toContain('"requester"."full_name" ilike ?');
    expect(sql).toContain('"note"."content" ilike ?');
    // Oito colunas diretas + EXISTS das notas.
    expect(bindings).toEqual(Array(9).fill("%MAAT%"));
  });

  it("busca em notas usa EXISTS correlacionado, sem junção e sem devolver conteúdo", () => {
    const { sql } = build({ search: "kickoff" });

    expect(sql).toMatch(
      /exists \(select 1 from "request_internal_notes" as "note" where note\.request_id = requests\.request_id and "note"\."content" ilike \?\)/,
    );
    expect(sql).not.toContain('join "request_internal_notes"');
    expect(sql).not.toContain('select "note"."content"');
  });

  it("noteCustodianUserId restringe a nota ao Responsável sem alterar o escopo da fila", () => {
    const { sql, bindings } = build({
      search: "kickoff",
      scopedUserId: 7,
      noteCustodianUserId: 7,
    });

    // 9 correspondências de search + custódia da nota + escopo (assignee + mapping).
    expect(bindings).toEqual([...Array(9).fill("%kickoff%"), 7, 7, false, 7, 7]);
    expect(sql.match(/"assignee_user"\."user_id" = \?/g)).toHaveLength(2);
    expect(sql.match(/"mapping_assignee"\."user_id" = \?/g)).toHaveLength(1);
  });

  it("sem noteCustodianUserId (Gestor/Administrador) a nota não é recortada", () => {
    const { sql, bindings } = build({ search: "kickoff" });

    expect(bindings).toEqual(Array(9).fill("%kickoff%"));
    expect(sql).not.toContain('"assignee_user"."user_id" = ?');
  });

  it("campos opcionais vazios não geram condições", () => {
    const { sql, bindings } = build({
      search: "",
      status: undefined,
      priority: undefined,
      assigneeId: undefined,
      unassigned: false,
    });

    expect(sql).not.toContain("where");
    expect(bindings).toEqual([]);
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
    expect(numeric.bindings).toEqual([20, false, 20, 20]);

    const uuid = "6f3a0c8e-1b2d-4f5a-9c7e-8d1a2b3c4d5e";
    const professional = build({ assigneeId: uuid });
    expect(professional.sql).toContain('"requests"."professional_id" = ?');
    expect(professional.bindings).toEqual([uuid, false, uuid, uuid]);
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
    expect(bindings).toEqual([7, false, 7, 7]);
  });

  it("combina search, status, priority e assignee com AND (sem escapar do escopo)", () => {
    const { sql, bindings } = build({
      search: "MAAT",
      status: "Em triagem",
      priority: "Alta",
      assigneeId: "20",
      scopedUserId: 7,
    });

    expect(bindings).toEqual([
      ...Array(9).fill("%MAAT%"),
      "Em triagem",
      "Alta",
      20,
      false,
      20,
      20,
      7,
      false,
      7,
      7,
    ]);
    // O grupo do search fecha e os demais filtros entram com AND.
    expect(sql).toMatch(/\) and "status"\."name" = \?/);
    expect(sql).toMatch(/"status"\."name" = \? and "priority_tbl"\."level" = \?/);
    expect(sql).toMatch(/"priority_tbl"\."level" = \? and \("assignee_user"\."user_id" = \? or /);
    // O OR do escopo é intencional e fica entre parênteses; o responsável do
    // mapeamento entra via EXISTS correlacionado.
    expect(sql).toMatch(/and \("assignee_user"\."user_id" = \? or \(exists /);
  });

  // Bordas reais de dia e o comportamento isolado de `createdTo` são
  // verificados com banco em `tests/db/queue.http.test.ts`.
  it("createdFrom e createdTo filtram created_at em UTC, com createdTo inclusivo", () => {
    const { sql, bindings } = build({ createdFrom: "2026-11-01", createdTo: "2026-11-30" });

    expect(sql).toContain('"requests"."created_at" >= (?::date::timestamp AT TIME ZONE ?)');
    expect(sql).toContain(
      `"requests"."created_at" < ((?::date + INTERVAL '1 day')::timestamp AT TIME ZONE ?)`,
    );
    expect(bindings).toEqual(["2026-11-01", "UTC", "2026-11-30", "UTC"]);
  });

  it("department compara requesters.department de forma exata e case-insensitive", () => {
    const { sql, bindings } = build({ department: "Desenvolvimento" });

    expect(sql).toContain('lower("requester"."department") = lower(?)');
    expect(bindings).toEqual(["Desenvolvimento"]);
  });

  it("data, departamento e busca entram juntos sem alterar o escopo do Analista", () => {
    const { sql, bindings } = build({
      search: "MAAT",
      createdFrom: "2026-11-01",
      department: "Desenvolvimento",
      scopedUserId: 7,
    });

    expect(bindings).toEqual([
      ...Array(9).fill("%MAAT%"),
      "2026-11-01",
      "UTC",
      "Desenvolvimento",
      7,
      false,
      7,
      7,
    ]);
    expect(sql).toContain('"requests"."created_at" >= (?::date::timestamp AT TIME ZONE ?)');
    expect(sql).toMatch(/and lower\("requester"\."department"\) = lower\(\?\)/);
    expect(sql).toMatch(/and \("assignee_user"\."user_id" = \? or \(exists /);
  });
});
