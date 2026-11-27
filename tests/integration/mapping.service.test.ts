import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEffectivePermissions } from "../../src/shared/catalog/permissionCatalog.ts";
import { resetFakeDb } from "../helpers/fakeDb.ts";
import type { MappingRequestContext } from "../../src/modules/queue/mapping.repository.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/shared/audit/accessDenied.ts", () => ({
  recordAccessDeniedAttempt: vi.fn(),
}));

vi.mock("../../src/modules/queue/mapping.repository.ts", () => ({
  findMappingRequestContext: vi.fn(),
  findCurrentMapping: vi.fn(),
  findLatestOpenMapping: vi.fn(),
  findMappingAssigneeCandidate: vi.fn(),
}));

const repository = await import("../../src/modules/queue/mapping.repository.ts");
const mappingService = await import("../../src/modules/queue/mapping.service.ts");

const PROTOCOL = "MAAT-ABCD-EFGH";
const MAPPING_ASSIGNEE_ID = "550e8400-e29b-41d4-a716-446655440000";

afterEach(() => {
  vi.resetAllMocks();
  resetFakeDb();
});

function actorWith(
  permissions: Array<{ permission_key: string; custody: "global" | "own" | "assigned" | "all" }>,
) {
  return { id: 7, email: "mapeador@neo.com", permissions: buildEffectivePermissions(permissions) };
}

function mappingContext(overrides: Partial<MappingRequestContext> = {}): MappingRequestContext {
  return {
    request_id: "req-1",
    protocol: PROTOCOL,
    professional_id: null,
    mapping_professional_id: null,
    status: "Aguardando mapeamento",
    assignee_user_id: 7,
    mapping_assignee_user_id: 7,
    requester_user_id: 1,
    status_id: null,
    is_terminal: false,
    is_restricted: false,
    title: "Solicitação",
    ...overrides,
  };
}

describe("mapping.service.upsertMappingService — designação", () => {
  it("recusa trocar o designado a quem só tem mapping:write", async () => {
    vi.mocked(repository.findMappingRequestContext).mockResolvedValue(mappingContext());
    vi.mocked(repository.findLatestOpenMapping).mockResolvedValue(null);

    await expect(
      mappingService.upsertMappingService(
        PROTOCOL,
        { mappingAssigneeId: MAPPING_ASSIGNEE_ID, completeMapping: false },
        actorWith([{ permission_key: "mapping:write", custody: "assigned" }]),
        undefined,
      ),
    ).rejects.toMatchObject({ statusCode: 403, code: "INSUFFICIENT_ROLE_PERMISSIONS" });
  });

  it("deixa a designação passar para quem tem request:assign e custódia", async () => {
    vi.mocked(repository.findMappingRequestContext).mockResolvedValue(mappingContext());
    vi.mocked(repository.findLatestOpenMapping).mockResolvedValue(null);
    vi.mocked(repository.findMappingAssigneeCandidate).mockResolvedValue(null);

    await expect(
      mappingService.upsertMappingService(
        PROTOCOL,
        { mappingAssigneeId: MAPPING_ASSIGNEE_ID, completeMapping: false },
        actorWith([
          { permission_key: "mapping:write", custody: "assigned" },
          { permission_key: "request:assign", custody: "assigned" },
          { permission_key: "assignee_directory:read", custody: "global" },
        ]),
        undefined,
      ),
    ).rejects.toMatchObject({ statusCode: 400, code: "assignee_not_assignable" });
  });
});

describe("mapping.service.getMappingService — custódia de leitura", () => {
  it("permite ao responsável da triagem ler o mapeamento", async () => {
    vi.mocked(repository.findMappingRequestContext).mockResolvedValue(
      mappingContext({ assignee_user_id: 7, mapping_assignee_user_id: 5 }),
    );
    vi.mocked(repository.findCurrentMapping).mockResolvedValue(null);

    const result = await mappingService.getMappingService(
      PROTOCOL,
      actorWith([{ permission_key: "mapping:read", custody: "assigned" }]),
      undefined,
    );

    expect(result.protocol).toBe(PROTOCOL);
    expect(result.id).toBeNull();
  });

  it("recusa a leitura de quem não tem mapping:read", async () => {
    vi.mocked(repository.findMappingRequestContext).mockResolvedValue(
      mappingContext({ assignee_user_id: 7, mapping_assignee_user_id: 5 }),
    );

    await expect(
      mappingService.getMappingService(
        PROTOCOL,
        actorWith([{ permission_key: "triage:read", custody: "assigned" }]),
        undefined,
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
