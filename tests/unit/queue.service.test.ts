import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "../../src/shared/types/user.ts";
import type { Role } from "../../src/shared/types/role.ts";

// A fronteira de dados é mockada: o teste verifica apenas o recorte derivado do ator.
vi.mock("../../src/modules/queue/queue.repository.ts", () => ({
  findQueueRequests: vi.fn(),
  fetchQueueMetrics: vi.fn(),
  fetchAllAssignees: vi.fn(),
  fetchAllDepartments: vi.fn(),
}));

const repository = await import("../../src/modules/queue/queue.repository.ts");
const { getQueueMetricsService, listQueueService } =
  await import("../../src/modules/queue/queue.service.ts");

function makeActor(role: Role, id = "7"): AuthenticatedUser {
  return {
    id,
    email: "usuario.ficticio@example.com",
    name: "Usuário fictício",
    role,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(repository.findQueueRequests).mockResolvedValue({ items: [], total: 0 });
  vi.mocked(repository.fetchQueueMetrics).mockResolvedValue({
    totalRequests: 0,
    unassignedRequests: 0,
    inProgressRequests: 0,
    overdueRequests: 0,
  });
  vi.mocked(repository.fetchAllAssignees).mockResolvedValue([]);
  vi.mocked(repository.fetchAllDepartments).mockResolvedValue([]);
});

describe("listQueueService — custódia da busca por notas", () => {
  it("usa o user_id do Analista como escopo da fila e como custódia da nota", async () => {
    await listQueueService({ page: 1, pageSize: 10, search: "kickoff" }, makeActor("Analista"));

    expect(repository.findQueueRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "kickoff",
        scopedUserId: 7,
        noteCustodianUserId: 7,
        limit: 10,
        offset: 0,
      }),
    );
  });

  it("não recorta nota nem fila para Gestor", async () => {
    await listQueueService({ page: 1, pageSize: 10, search: "kickoff" }, makeActor("Gestor"));

    expect(repository.findQueueRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        scopedUserId: undefined,
        noteCustodianUserId: undefined,
      }),
    );
  });

  it("usa o fail-safe 0 quando o id do Analista é inválido", async () => {
    await listQueueService(
      { page: 1, pageSize: 10, search: "kickoff" },
      makeActor("Analista", "invalido"),
    );

    expect(repository.findQueueRequests).toHaveBeenCalledWith(
      expect.objectContaining({ scopedUserId: 0, noteCustodianUserId: 0 }),
    );
  });

  it("repassa filtros de data/departamento e ordenação ao repositório", async () => {
    await listQueueService(
      {
        page: 2,
        pageSize: 5,
        createdFrom: "2026-11-01",
        createdTo: "2026-11-30",
        department: "Desenvolvimento",
        sortBy: "protocol",
        sortOrder: "asc",
      },
      makeActor("Gestor"),
    );

    expect(repository.findQueueRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        createdFrom: "2026-11-01",
        createdTo: "2026-11-30",
        department: "Desenvolvimento",
        sortBy: "protocol",
        sortOrder: "asc",
        limit: 5,
        offset: 5,
      }),
    );
  });

  it("devolve departamentos globais no envelope da fila", async () => {
    vi.mocked(repository.fetchAllDepartments).mockResolvedValue(["Desenvolvimento", "Financeiro"]);

    const response = await listQueueService({ page: 1, pageSize: 10 }, makeActor("Gestor"));

    expect(repository.fetchAllDepartments).toHaveBeenCalledOnce();
    expect(response.departments).toEqual(["Desenvolvimento", "Financeiro"]);
  });
});

describe("getQueueMetricsService — mesmo recorte da fila", () => {
  it("conta apenas as solicitações do Analista", async () => {
    await getQueueMetricsService(makeActor("Analista"));

    expect(repository.fetchQueueMetrics).toHaveBeenCalledWith(7);
  });

  it("não recorta as métricas para Administrador", async () => {
    await getQueueMetricsService(makeActor("Administrador"));

    expect(repository.fetchQueueMetrics).toHaveBeenCalledWith(undefined);
  });
});
