import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PermissionActor } from "../../src/shared/access/permissionActor.ts";
import {
  buildEffectivePermissions,
  type EffectivePermission,
} from "../../src/shared/catalog/permissionCatalog.ts";

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

function makeActor(permissions: readonly EffectivePermission[], id = 7): PermissionActor {
  return {
    id,
    email: "usuario.ficticio@example.com",
    permissions,
  };
}

/** Analista: fila e notas restritas às solicitações sob sua responsabilidade. */
const ANALYST_PERMISSIONS = buildEffectivePermissions([
  { permission_key: "queue:read", custody: "assigned" },
  { permission_key: "internal_note:read", custody: "assigned" },
]);

/** Gestor: fila e notas de todas as solicitações. */
const MANAGER_PERMISSIONS = buildEffectivePermissions([
  { permission_key: "queue:read", custody: "all" },
  { permission_key: "internal_note:read", custody: "all" },
]);

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
    await listQueueService(
      { page: 1, pageSize: 10, search: "kickoff" },
      makeActor(ANALYST_PERMISSIONS),
    );

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
    await listQueueService(
      { page: 1, pageSize: 10, search: "kickoff" },
      makeActor(MANAGER_PERMISSIONS),
    );

    expect(repository.findQueueRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        scopedUserId: undefined,
        noteCustodianUserId: undefined,
      }),
    );
  });

  it("usa o fail-safe 0 quando o ator não tem internal_note:read", async () => {
    const queueOnly = buildEffectivePermissions([
      { permission_key: "queue:read", custody: "assigned" },
    ]);

    await listQueueService({ page: 1, pageSize: 10, search: "kickoff" }, makeActor(queueOnly));

    expect(repository.findQueueRequests).toHaveBeenCalledWith(
      expect.objectContaining({ scopedUserId: 7, noteCustodianUserId: 0 }),
    );
  });

  it("nega o vínculo assigned quando o id do ator não é válido", async () => {
    await expect(
      listQueueService(
        { page: 1, pageSize: 10, search: "kickoff" },
        makeActor(ANALYST_PERMISSIONS, 0),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
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
      makeActor(MANAGER_PERMISSIONS),
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

    const response = await listQueueService(
      { page: 1, pageSize: 10 },
      makeActor(MANAGER_PERMISSIONS),
    );

    expect(repository.fetchAllDepartments).toHaveBeenCalledOnce();
    expect(response.departments).toEqual(["Desenvolvimento", "Financeiro"]);
  });
});

describe("getQueueMetricsService — mesmo recorte da fila", () => {
  it("conta apenas as solicitações do Analista", async () => {
    await getQueueMetricsService(makeActor(ANALYST_PERMISSIONS));

    expect(repository.fetchQueueMetrics).toHaveBeenCalledWith(7);
  });

  it("não recorta as métricas para Administrador", async () => {
    const adminPermissions = buildEffectivePermissions([
      { permission_key: "queue:read", custody: "all" },
    ]);

    await getQueueMetricsService(makeActor(adminPermissions));

    expect(repository.fetchQueueMetrics).toHaveBeenCalledWith(undefined);
  });
});
