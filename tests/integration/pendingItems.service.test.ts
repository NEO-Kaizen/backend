import { afterEach, describe, expect, it, vi } from "vitest";
import { resetFakeDb } from "../helpers/fakeDb.ts";
import type { AuthenticatedUser } from "../../src/shared/types/user.ts";
import type { PendingCaller } from "../../src/modules/pendingItems/pendingItems.service.ts";
import type { RequestRef } from "../../src/modules/pendingItems/pendingItems.repository.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

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
    respondPendingItemTx: vi.fn(),
  };
});

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

function makeRequest(overrides: Partial<RequestRef> = {}): RequestRef {
  return {
    request_id: REQUEST_ID,
    protocol: PROTOCOL,
    status: "Pendente de informações",
    status_id: 5,
    requester_user_id: OWNER_ID,
    // Snapshot divergente do cadastro da conta — a reprodução da issue #202.
    requester_name: "Ana Paula Santos",
    requester_email: "ana.santos@empresa.com",
    ...overrides,
  };
}

function makeCaller(overrides: Partial<AuthenticatedUser> = {}): PendingCaller {
  return {
    user: {
      id: String(OWNER_ID),
      name: "Solicitante Teste",
      email: "solicitante.teste@empresa.com",
      role: "Solicitante",
      ...overrides,
    },
    requesterIdentity: null,
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

    await expect(service.listPendingItems(PROTOCOL, makeCaller())).resolves.toEqual({
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
        makeCaller({
          id: "112",
          name: "Ana Paula Santos",
          email: "ana.santos@empresa.com",
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("usa o fallback de nome e e-mail para solicitações legadas sem vínculo", async () => {
    arrangeList(makeRequest({ requester_user_id: null }));
    const caller = makeCaller({
      id: "999",
      name: "Ana Paula Santos",
      email: "ana.santos@empresa.com",
    });

    await expect(service.listPendingItems(PROTOCOL, caller)).resolves.toEqual({
      batchId: null,
      requestAttachment: false,
      items: [],
    });
  });

  it("recusa legado sem vínculo quando o nome diverge", async () => {
    arrangeList(makeRequest({ requester_user_id: null }));
    const caller = makeCaller({
      id: "999",
      name: "Outra Pessoa",
      email: "ana.santos@empresa.com",
    });

    await expect(service.listPendingItems(PROTOCOL, caller)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("recusa legado sem vínculo quando o e-mail diverge", async () => {
    arrangeList(makeRequest({ requester_user_id: null }));
    const caller = makeCaller({
      id: "999",
      name: "Ana Paula Santos",
      email: "outra@empresa.com",
    });

    await expect(service.listPendingItems(PROTOCOL, caller)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("deixa perfil interno passar sem checagem de custódia", async () => {
    arrangeList(makeRequest());
    const caller = makeCaller({
      id: "1",
      name: "Analista Teste",
      email: "analista.teste@empresa.com",
      role: "Analista",
    });

    await expect(service.listPendingItems(PROTOCOL, caller)).resolves.toEqual({
      batchId: null,
      requestAttachment: false,
      items: [],
    });
  });
});

describe("pendingItems.service.respondPendingItem — Posse do Solicitante autenticado", () => {
  it("responde a pendência do dono vinculado por requester_user_id", async () => {
    vi.mocked(repository.findRequestByProtocol).mockResolvedValue(makeRequest());
    vi.mocked(repository.findPendingItemById).mockResolvedValue({
      pending_item_id: PENDING_ITEM_ID,
      request_id: REQUEST_ID,
      batch_id: "batch-1",
      type: "observation",
      status: "requested",
    });
    vi.mocked(repository.respondPendingItemTx).mockResolvedValue({
      pending_item_id: PENDING_ITEM_ID,
      batch_id: "batch-1",
      type: "observation",
      status: "responded",
      comment: "Envie o relatório",
      response_text: "Segue o relatório revisado.",
      created_at: "2026-11-01T10:00:00.000Z",
      responded_at: "2026-11-25T12:00:00.000Z",
    });
    vi.mocked(repository.findAttachmentsByPendingItemIds).mockResolvedValue(new Map());

    const item = await service.respondPendingItem(
      PROTOCOL,
      PENDING_ITEM_ID,
      { response: "Segue o relatório revisado." },
      "solicitante.teste@empresa.com",
      false,
      undefined,
      makeCaller(),
    );

    expect(item).toMatchObject({
      id: PENDING_ITEM_ID,
      protocol: PROTOCOL,
      status: "responded",
      responseText: "Segue o relatório revisado.",
    });
    expect(repository.respondPendingItemTx).toHaveBeenCalledWith(
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
        "outro@empresa.com",
        false,
        undefined,
        makeCaller({ id: "112" }),
      ),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(repository.findPendingItemById).not.toHaveBeenCalled();
    expect(repository.respondPendingItemTx).not.toHaveBeenCalled();
  });
});
