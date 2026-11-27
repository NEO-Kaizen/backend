import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeAuthState, makeAuthUser, makeToken } from "../helpers/factories.ts";
import { startTestServer, TestClient, type TestServer } from "../helpers/http.ts";

/**
 * Notificações são autoatendimento: sem chave no catálogo RBAC, o destinatário
 * é sempre o usuário da sessão. A persistência é mockada para provar que a
 * rota nunca aceita um destinatário vindo do cliente e que um usuário não lê a
 * Notificação de outro.
 */
vi.mock("../../src/database/conection.ts", () => ({ default: {} }));

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  getAuthState: vi.fn(),
  listUserPermissions: vi.fn(),
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock("../../src/modules/notifications/notifications.repository.ts", () => ({
  listByRecipient: vi.fn(),
  findByIdsForRecipient: vi.fn(),
  findAfterIdForRecipient: vi.fn(),
  countUnread: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const notificationsRepository =
  await import("../../src/modules/notifications/notifications.repository.ts");

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(() => {
  vi.mocked(authRepository.getAuthState).mockReset();
  vi.mocked(notificationsRepository.listByRecipient).mockReset();
  vi.mocked(notificationsRepository.markRead).mockReset();
  vi.mocked(notificationsRepository.countUnread).mockReset();
});

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(async () => {
  await server.close();
});

function mockSession(userId: number): string {
  vi.mocked(authRepository.getAuthState).mockImplementation(async () =>
    makeAuthState({ profile_id: 2, profile_name: "Analista" }),
  );
  vi.mocked(authRepository.findUserById).mockResolvedValue(
    makeAuthUser({ user_id: userId, profile_id: 2 }),
  );
  vi.mocked(authRepository.listUserPermissions).mockResolvedValue([]);
  return makeToken({ id: String(userId), name: "Usuário", email: `user${userId}@neo.com` });
}

function notificationRow(id: string, recipientPayloadTitle: string) {
  return {
    notification_id: id,
    event_type: "status_changed",
    payload: {
      type: "status_changed",
      protocol: "MAAT-0001",
      title: recipientPayloadTitle,
      newStatus: "Em triagem",
    },
    read_at: null,
    created_at: "2026-11-27T12:00:00.000Z",
  };
}

describe("HTTP — /notifications (self-service)", () => {
  it("exige sessão: sem cookie responde 401", async () => {
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/notifications");

    expect(response.status).toBe(401);
    expect(notificationsRepository.listByRecipient).not.toHaveBeenCalled();
  });

  it("lê apenas as Notificações do usuário da sessão", async () => {
    const client = new TestClient(server.baseUrl);
    const token = mockSession(7);
    vi.mocked(notificationsRepository.listByRecipient).mockImplementation(
      async (recipientUserId) => [notificationRow("n-1", `titulo-${recipientUserId}`)],
    );

    const response = await client.get("/notifications", {
      cookie: `session_id=${token}`,
    });

    expect(response.status).toBe(200);
    expect(notificationsRepository.listByRecipient).toHaveBeenCalledWith(
      7,
      null,
      expect.any(Number),
    );
    expect(response.body).toMatchObject({
      items: [{ id: "n-1", payload: { title: "titulo-7" } }],
    });
  });

  it("não vaza Notificação entre usuários diferentes", async () => {
    const first = new TestClient(server.baseUrl);
    const firstToken = mockSession(7);
    vi.mocked(notificationsRepository.listByRecipient).mockResolvedValue([
      notificationRow("n-7", "do-sete"),
    ]);

    const firstResponse = await first.get("/notifications", {
      cookie: `session_id=${firstToken}`,
    });
    expect(firstResponse.body).toMatchObject({ items: [{ payload: { title: "do-sete" } }] });

    const second = new TestClient(server.baseUrl);
    const secondToken = mockSession(8);
    vi.mocked(notificationsRepository.listByRecipient).mockResolvedValue([
      notificationRow("n-8", "do-oito"),
    ]);

    const secondResponse = await second.get("/notifications", {
      cookie: `session_id=${secondToken}`,
    });
    expect(secondResponse.body).toMatchObject({ items: [{ payload: { title: "do-oito" } }] });
    expect(notificationsRepository.listByRecipient).toHaveBeenLastCalledWith(
      8,
      null,
      expect.any(Number),
    );
  });

  it("ignora destinatário enviado pelo cliente ao marcar como lida", async () => {
    const client = new TestClient(server.baseUrl);
    const token = mockSession(7);
    vi.mocked(notificationsRepository.markRead).mockResolvedValue({
      ...notificationRow("6f3a0c8e-1b2d-4f5a-9c7e-8d1a2b3c4d5e", "do-sete"),
      read_at: "2026-11-27T13:00:00.000Z",
    });

    const response = await client.patch(
      "/notifications/6f3a0c8e-1b2d-4f5a-9c7e-8d1a2b3c4d5e/read",
      // Campo extra não pode trocar o destinatário.
      { recipientUserId: 8 },
      { cookie: `session_id=${token}` },
    );

    expect(response.status).toBe(200);
    expect(notificationsRepository.markRead).toHaveBeenCalledWith(
      7,
      "6f3a0c8e-1b2d-4f5a-9c7e-8d1a2b3c4d5e",
    );
  });
});
