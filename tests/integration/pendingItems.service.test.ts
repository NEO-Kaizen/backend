import { afterEach, describe, expect, it, vi } from "vitest";
import { resetFakeDb } from "../helpers/fakeDb.ts";
import type { AuthenticatedUser } from "../../src/shared/types/user.ts";
import type { PendingCaller } from "../../src/modules/pendingItems/pendingItems.service.ts";
import type {
  PendingItemRow,
  RequestRef,
} from "../../src/modules/pendingItems/pendingItems.repository.ts";
import { BASE_PROFILES } from "../../src/shared/catalog/baseProfiles.ts";
import {
  buildEffectivePermissions,
  type PermissionGrantSource,
} from "../../src/shared/catalog/permissionCatalog.ts";
import { findActiveAdminUserIds } from "../../src/modules/users/users.repository.ts";
import { emitPendingItemRespondedNotification } from "../../src/shared/notifications/pendingItemRespondedNotification.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

// A trilha de acesso recusado resolve o snapshot do Perfil do ator com um JOIN
// em `users` que o fakeDb não modela; o comportamento observado aqui é o 404.
vi.mock("../../src/shared/audit/auditLogger.ts", () => ({
  recordAudit: vi.fn(),
}));

vi.mock("../../src/modules/pendingItems/pendingItems.repository.ts", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../src/modules/pendingItems/pendingItems.repository.ts")
    >();
  return {
    ...actual,
    findRequestByProtocol: vi.fn(),
    findPendingItemsByRequestId: vi.fn(),
    findAttachmentsByPendingItemIds: vi.fn(),
    findPendingItemById: vi.fn(),
    applyPendingItemResponse: vi.fn(),
    findAssigneeUserIdByRequestId: vi.fn(),
  };
});

vi.mock("../../src/modules/users/users.repository.ts", () => ({
  findActiveAdminUserIds: vi.fn(),
  findUserIdByEmail: vi.fn(),
}));

vi.mock("../../src/shared/notifications/pendingItemRespondedNotification.ts", () => ({
  emitPendingItemRespondedNotification: vi.fn(),
}));

vi.mock("../../src/modules/requests/requests.repository.ts", () => ({
  findInternalRequestByProtocol: vi.fn(),
}));

vi.mock("../../src/modules/portalConfig/portalConfig.repository.ts", () => ({
  getSolicitationMode: vi.fn(),
}));

const repository = await import("../../src/modules/pendingItems/pendingItems.repository.ts");
const service = await import("../../src/modules/pendingItems/pendingItems.service.ts");

const PROTOCOL = "MAAT-2R7Q-4M1C";
const REQUEST_ID = "req-1";
const PENDING_ITEM_ID = "pi-1";
const OWNER_ID = 104;

type BaseProfileName = "Solicitante" | "Analista" | "Gestor" | "Administrador" | "Admin Root";

/** Concessões reais da matriz de perfis base (`src/shared/catalog/baseProfiles.ts`). */
function grantRowsOf(profileName: BaseProfileName): PermissionGrantSource[] {
  const profile = BASE_PROFILES.find((candidate) => candidate.profileName === profileName);
  if (!profile) throw new Error(`Perfil base ausente: ${profileName}`);

  return profile.permissions.map(({ key, custody }) => ({ permission_key: key, custody }));
}

function permissionsOf(profileName: BaseProfileName) {
  return buildEffectivePermissions(grantRowsOf(profileName));
}

function makeRequest(overrides: Partial<RequestRef> = {}): RequestRef {
  return {
    request_id: REQUEST_ID,
    protocol: PROTOCOL,
    title: "Solicitação de teste",
    status: "Pendente de informações",
    status_id: 5,
    reopen_ref: null,
    requester_user_id: OWNER_ID,
    responsible_user_id: null,
    // Snapshot divergente do cadastro da conta — a reprodução da issue #202.
    requester_name: "Ana Paula Santos",
    requester_email: "ana.santos@empresa.com",
    ...overrides,
  };
}

function makeCaller(
  overrides: Partial<AuthenticatedUser> = {},
  profileName: BaseProfileName = "Solicitante",
): PendingCaller {
  return {
    user: {
      id: String(OWNER_ID),
      name: "Solicitante Teste",
      email: "solicitante.teste@empresa.com",
      profileId: "1",
      profileName: "Solicitante",
      ...overrides,
    },
    permissions: permissionsOf(profileName),
    requesterIdentity: null,
  };
}

function makePendingItemRow(overrides: Partial<PendingItemRow> = {}): PendingItemRow {
  return {
    pending_item_id: PENDING_ITEM_ID,
    request_id: REQUEST_ID,
    batch_id: "batch-1",
    type: "observation",
    field_key: null,
    field_label: null,
    current_value: null,
    comment: "Envie o relatório",
    description: null,
    status: "requested",
    corrected_value: null,
    response_text: null,
    request_attachment: false,
    deadline: null,
    created_at: "2026-11-01T10:00:00.000Z",
    responded_at: null,
    validated_at: null,
    ...overrides,
  };
}

function arrangeList(request: RequestRef): void {
  vi.mocked(repository.findRequestByProtocol).mockResolvedValue(request);
  vi.mocked(repository.findPendingItemsByRequestId).mockResolvedValue([]);
  vi.mocked(repository.findAttachmentsByPendingItemIds).mockResolvedValue(new Map());
}

afterEach(() => {
  vi.resetAllMocks();
  resetFakeDb();
});

describe("pendingItems.service — Posse do Solicitante autenticado", () => {
  it("lista para o dono vinculado por requester_user_id mesmo com snapshot divergente", async () => {
    arrangeList(makeRequest());

    await expect(service.listPendingItems(PROTOCOL, makeCaller(), undefined)).resolves.toEqual({
      batchId: null,
      requestAttachment: false,
      items: [],
    });
  });

  it("recusa outro Solicitante ainda que o snapshot bata", async () => {
    arrangeList(makeRequest());

    await expect(
      service.listPendingItems(
        PROTOCOL,
        makeCaller(
          {
            id: "112",
            name: "Ana Paula Santos",
            email: "ana.santos@empresa.com",
          },
          "Solicitante",
        ),
        undefined,
      ),
    ).rejects.toMatchObject({ statusCode: 404, code: "request_not_found" });
  });

  it("usa o fallback de nome e e-mail para solicitações legadas sem vínculo", async () => {
    arrangeList(makeRequest({ requester_user_id: null }));
    const caller = makeCaller({
      id: "999",
      name: "Ana Paula Santos",
      email: "ana.santos@empresa.com",
    });

    await expect(service.listPendingItems(PROTOCOL, caller, undefined)).resolves.toEqual({
      batchId: null,
      requestAttachment: false,
      items: [],
    });
  });

  it("na sessão o nome não participa da Posse (só o e-mail identifica o legado)", async () => {
    arrangeList(makeRequest({ requester_user_id: null }));
    const caller = makeCaller({
      id: "999",
      name: "Outro Nome",
      email: "ana.santos@empresa.com",
    });

    await expect(service.listPendingItems(PROTOCOL, caller, undefined)).resolves.toEqual({
      batchId: null,
      requestAttachment: false,
      items: [],
    });
  });

  it("recusa legado sem vínculo quando o e-mail diverge", async () => {
    arrangeList(makeRequest({ requester_user_id: null }));
    const caller = makeCaller({
      id: "999",
      name: "Ana Paula Santos",
      email: "outra@empresa.com",
    });

    await expect(service.listPendingItems(PROTOCOL, caller, undefined)).rejects.toMatchObject({
      statusCode: 404,
      code: "request_not_found",
    });
  });

  it("libera perfil interno com Custódia assigned sobre o Responsável", async () => {
    arrangeList(makeRequest({ requester_user_id: OWNER_ID, responsible_user_id: OWNER_ID }));
    const caller = makeCaller(
      {
        id: String(OWNER_ID),
        name: "Analista Teste",
        email: "analista.teste@empresa.com",
        profileId: "2",
        profileName: "Analista",
      },
      "Analista",
    );

    await expect(service.listPendingItems(PROTOCOL, caller, undefined)).resolves.toEqual({
      batchId: null,
      requestAttachment: false,
      items: [],
    });
  });

  it("recusa perfil interno sem Custódia sobre o Responsável", async () => {
    arrangeList(makeRequest({ requester_user_id: 1, responsible_user_id: 1 }));
    const caller = makeCaller(
      {
        id: String(OWNER_ID),
        name: "Analista Teste",
        email: "analista.teste@empresa.com",
        profileId: "2",
        profileName: "Analista",
      },
      "Analista",
    );

    await expect(service.listPendingItems(PROTOCOL, caller, undefined)).rejects.toMatchObject({
      statusCode: 404,
      code: "request_not_found",
    });
  });
});

describe("pendingItems.service.respondPendingItem — Posse do Solicitante autenticado", () => {
  it("responde a pendência do dono vinculado por requester_user_id", async () => {
    vi.mocked(repository.findRequestByProtocol).mockResolvedValue(makeRequest());
    vi.mocked(repository.findPendingItemById).mockResolvedValue(makePendingItemRow());
    vi.mocked(repository.applyPendingItemResponse).mockResolvedValue({
      row: makePendingItemRow({
        status: "responded",
        response_text: "Segue o relatório revisado.",
        responded_at: "2026-11-25T12:00:00.000Z",
      }),
      auditId: "audit-1",
    });
    vi.mocked(repository.findAttachmentsByPendingItemIds).mockResolvedValue(new Map());
    vi.mocked(repository.findAssigneeUserIdByRequestId).mockResolvedValue(null);
    vi.mocked(findActiveAdminUserIds).mockResolvedValue([]);
    vi.mocked(emitPendingItemRespondedNotification).mockResolvedValue([]);

    const item = await service.respondPendingItem(
      PROTOCOL,
      PENDING_ITEM_ID,
      { response: "Segue o relatório revisado." },
      undefined,
      makeCaller(),
    );

    expect(item).toMatchObject({
      id: PENDING_ITEM_ID,
      protocol: PROTOCOL,
      status: "responded",
      responseText: "Segue o relatório revisado.",
    });
    expect(repository.applyPendingItemResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        requestId: REQUEST_ID,
        protocol: PROTOCOL,
        pendingItemId: PENDING_ITEM_ID,
      }),
    );
  });

  it("recusa resposta de outro Solicitante sem tocar na pendência", async () => {
    vi.mocked(repository.findRequestByProtocol).mockResolvedValue(makeRequest());

    await expect(
      service.respondPendingItem(
        PROTOCOL,
        PENDING_ITEM_ID,
        { response: "Tentativa indevida" },
        undefined,
        makeCaller({ id: "112" }),
      ),
    ).rejects.toMatchObject({ statusCode: 404, code: "request_not_found" });

    expect(repository.findPendingItemById).not.toHaveBeenCalled();
    expect(repository.applyPendingItemResponse).not.toHaveBeenCalled();
  });
});
