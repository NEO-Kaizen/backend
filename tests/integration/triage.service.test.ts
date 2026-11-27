import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEffectivePermissions } from "../../src/shared/catalog/permissionCatalog.ts";
import { resetFakeDb } from "../helpers/fakeDb.ts";
import type { RequestContextRow } from "../../src/modules/requests/triage/triage.repository.ts";
import type { CreateTriagePayload } from "../../src/modules/requests/triage/triage.schema.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/shared/audit/accessDenied.ts", () => ({
  recordAccessDeniedAttempt: vi.fn(),
}));

vi.mock("../../src/shared/audit/auditLogger.ts", () => ({
  recordAudit: vi.fn(),
}));

vi.mock("../../src/modules/requests/triage/triage.repository.ts", () => ({
  findRequestContext: vi.fn(),
  findLatestTriage: vi.fn(),
}));

const repository = await import("../../src/modules/requests/triage/triage.repository.ts");
const triageService = await import("../../src/modules/requests/triage/triage.service.ts");

const PROTOCOL = "MAAT-ABCD-EFGH";

afterEach(() => {
  vi.resetAllMocks();
  resetFakeDb();
});

function actorWith(
  permissions: Array<{ permission_key: string; custody: "global" | "own" | "assigned" | "all" }>,
) {
  return {
    id: 7,
    name: "Analista",
    email: "analista@neo.com",
    permissions: buildEffectivePermissions(permissions),
  };
}

function requestContext(overrides: Partial<RequestContextRow> = {}): RequestContextRow {
  return {
    request_id: "req-1",
    protocol: PROTOCOL,
    professional_id: "prof-5",
    assignee_user_id: 5,
    mapping_assignee_user_id: 5,
    status_id: 1,
    status_name: "Em triagem",
    status_is_restricted: false,
    status_is_terminal: false,
    category_name: "Categoria",
    requester_user_id: 1,
    title: "Solicitação",
    ...overrides,
  };
}

describe("triage.service.getTriage — custódia de leitura", () => {
  it("permite ao responsável da triagem ler a triagem", async () => {
    vi.mocked(repository.findRequestContext).mockResolvedValue(
      requestContext({ assignee_user_id: 7, mapping_assignee_user_id: 5 }),
    );
    vi.mocked(repository.findLatestTriage).mockResolvedValue(null);

    await expect(
      triageService.getTriage(
        PROTOCOL,
        actorWith([{ permission_key: "triage:read", custody: "assigned" }]),
      ),
    ).resolves.toBeNull();
  });

  it("permite ao designado do mapeamento ler a triagem", async () => {
    vi.mocked(repository.findRequestContext).mockResolvedValue(
      requestContext({ assignee_user_id: 5, mapping_assignee_user_id: 7 }),
    );
    vi.mocked(repository.findLatestTriage).mockResolvedValue(null);

    await expect(
      triageService.getTriage(
        PROTOCOL,
        actorWith([{ permission_key: "triage:read", custody: "assigned" }]),
      ),
    ).resolves.toBeNull();
  });

  it("recusa a leitura de quem não tem triage:read", async () => {
    vi.mocked(repository.findRequestContext).mockResolvedValue(
      requestContext({ assignee_user_id: 5, mapping_assignee_user_id: 7 }),
    );

    await expect(
      triageService.getTriage(
        PROTOCOL,
        actorWith([{ permission_key: "mapping:read", custody: "assigned" }]),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("triage.service.createTriage — escrita exclusiva da triagem", () => {
  it("recusa o designado do mapeamento mesmo com triage:read", async () => {
    vi.mocked(repository.findRequestContext).mockResolvedValue(
      requestContext({ assignee_user_id: 5, mapping_assignee_user_id: 7 }),
    );

    await expect(
      triageService.createTriage(
        PROTOCOL,
        {} as CreateTriagePayload,
        actorWith([
          { permission_key: "triage:read", custody: "assigned" },
          { permission_key: "mapping:write", custody: "assigned" },
        ]),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
