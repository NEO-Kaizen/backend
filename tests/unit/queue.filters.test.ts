import { describe, expect, it, vi } from "vitest";
import { applyQueueFilters } from "../../src/modules/queue/queue.filters.ts";

interface RecordedCall {
  method: string;
  args: unknown[];
}

/**
 * Query builder falso que registra as chamadas encadeadas. Quando o primeiro
 * argumento é um callback (sub-builder), ele é executado com o próprio builder
 * para capturar as condições aninhadas.
 */
function createQueryBuilder() {
  const calls: RecordedCall[] = [];

  const builder = {
    andWhere: vi.fn((...args: unknown[]) => {
      calls.push({ method: "andWhere", args });
      if (typeof args[0] === "function") (args[0] as (b: unknown) => void)(builder);
      return builder;
    }),
    where: vi.fn((...args: unknown[]) => {
      calls.push({ method: "where", args });
      return builder;
    }),
    orWhere: vi.fn((...args: unknown[]) => {
      calls.push({ method: "orWhere", args });
      return builder;
    }),
    whereNull: vi.fn((...args: unknown[]) => {
      calls.push({ method: "whereNull", args });
      return builder;
    }),
  };

  return { builder, calls };
}

function methods(calls: RecordedCall[]): string[] {
  return calls.map((call) => call.method);
}

describe("applyQueueFilters", () => {
  it("sem filtros, não aplica nenhuma condição", () => {
    const { builder, calls } = createQueryBuilder();
    applyQueueFilters(builder as never, {});
    expect(calls).toHaveLength(0);
  });

  it("search usa ILIKE em protocolo/e-mail/nome dentro de um andWhere", () => {
    const { builder, calls } = createQueryBuilder();
    applyQueueFilters(builder as never, { search: "MAAT" });

    expect(calls[0]?.method).toBe("andWhere");
    expect(methods(calls)).toEqual(["andWhere", "where", "orWhere", "orWhere"]);
    expect(calls[1]?.args).toEqual(["requests.protocol", "ilike", "%MAAT%"]);
    expect(calls[2]?.args[0]).toBe("requester.corporate_email");
    expect(calls[3]?.args[0]).toBe("requester.full_name");
  });

  it("status e priority aplicam andWhere pela tabela correta", () => {
    const { builder, calls } = createQueryBuilder();
    applyQueueFilters(builder as never, { status: "Em triagem", priority: "Alta" });

    expect(calls[0]?.args).toEqual(["status.name", "Em triagem"]);
    expect(calls[1]?.args).toEqual(["priority_tbl.level", "Alta"]);
  });

  it('priority "nenhum" usa whereNull em requests.priority_id', () => {
    const { builder, calls } = createQueryBuilder();
    applyQueueFilters(builder as never, { priority: "nenhum" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe("whereNull");
    expect(calls[0]?.args[0]).toBe("requests.priority_id");
  });

  it("assigneeId numérico filtra por user_id; UUID por professional_id", () => {
    const numeric = createQueryBuilder();
    applyQueueFilters(numeric.builder as never, { assigneeId: "20" });
    expect(numeric.calls[0]?.args).toEqual(["assignee_user.user_id", 20]);

    const uuid = createQueryBuilder();
    applyQueueFilters(uuid.builder as never, {
      assigneeId: "6f3a0c8e-1b2d-4f5a-9c7e-8d1a2b3c4d5e",
    });
    expect(uuid.calls[0]?.args).toEqual([
      "requests.professional_id",
      "6f3a0c8e-1b2d-4f5a-9c7e-8d1a2b3c4d5e",
    ]);
  });

  it("unassigned usa whereNull e tem precedência sobre assigneeId", () => {
    const { builder, calls } = createQueryBuilder();
    applyQueueFilters(builder as never, { unassigned: true, assigneeId: "unassigned" });
    expect(calls[0]?.method).toBe("whereNull");
    expect(calls[0]?.args[0]).toBe("requests.professional_id");
  });

  it("scopedUserId restringe ao responsável (assignee OU mapping)", () => {
    const { builder, calls } = createQueryBuilder();
    applyQueueFilters(builder as never, { scopedUserId: 7 });

    expect(calls[0]?.method).toBe("andWhere");
    expect(methods(calls)).toEqual(["andWhere", "where", "orWhere"]);
    expect(calls[1]?.args).toEqual(["assignee_user.user_id", 7]);
    expect(calls[2]?.args).toEqual(["mapping_assignee.user_id", 7]);
  });
});
