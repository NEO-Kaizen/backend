import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from "vitest";
import { BASE_PROFILES } from "../../src/shared/catalog/baseProfiles.ts";
import {
  makeAnalyst,
  makeAuthState,
  makeAuthUser,
  makeToken,
  makeUserPage,
  makeUserProfile,
  makeUserRow,
  makeUserSummary,
  PROFILE_IDS,
} from "../helpers/factories.ts";
import {
  expectErrorEnvelope,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import { fakeDbState, resetFakeDb } from "../helpers/fakeDb.ts";

// Foco no wiring de autenticação/autorização de `/users`; service e repository
// são mockados. Persistência real em `tests/db/users.service.test.ts`.
vi.mock("../../src/database/conection.ts", async () => {
  const { createFakeDb } = await import("../helpers/fakeDb.ts");
  return { default: createFakeDb() };
});

vi.mock("../../src/modules/auth/auth.repository.ts", () => ({
  getAuthState: vi.fn(),
  listUserPermissions: vi.fn(),
}));

// O fakeDb cobre apenas a escrita da auditoria; o snapshot do Perfil do ator
// (SELECT em `users`) é substituído aqui, mantendo as linhas observáveis.
vi.mock("../../src/shared/audit/auditLogger.ts", () => ({
  recordAudit: vi.fn(),
}));

vi.mock("../../src/modules/users/users.repository.ts", () => ({
  findProfileById: vi.fn(),
  listProfilePermissions: vi.fn(),
  createUser: vi.fn(),
  createProfessionalData: vi.fn(),
  createRequesterData: vi.fn(),
  findUserById: vi.fn(),
  findUserProfile: vi.fn(),
  updateStatus: vi.fn(),
  setTemporaryPassword: vi.fn(),
  listUsers: vi.fn(),
  listAssignableProfessionals: vi.fn(),
  findRequesterUserIdByProtocol: vi.fn(),
  listOpenAssignedProtocolsForUser: vi.fn(),
  fetchUserMetrics: vi.fn(),
  mergeRequesterData: vi.fn(),
  updateUserFields: vi.fn(),
  syncRequesterIdentity: vi.fn(),
  upsertProfessionalData: vi.fn(),
  upsertRequesterData: vi.fn(),
  deleteProfessionalData: vi.fn(),
  removeUserAvatar: vi.fn(),
  setUserAvatar: vi.fn(),
}));

const authRepository = await import("../../src/modules/auth/auth.repository.ts");
const auditLogger = await import("../../src/shared/audit/auditLogger.ts");
const repository = await import("../../src/modules/users/users.repository.ts");

let server: TestServer;

const PROFILE_LABEL_BY_ID: Record<number, string> = {
  [PROFILE_IDS.Solicitante as number]: "Solicitante",
  [PROFILE_IDS.Analista as number]: "Analista",
  [PROFILE_IDS.Administrador as number]: "Administrador",
  [PROFILE_IDS.Gestor as number]: "Gestor",
  [PROFILE_IDS["Admin Root"] as number]: "Admin Root",
};

function permissionRowsFor(profileLabel: string) {
  const profile = BASE_PROFILES.find(
    (candidate) => candidate.profileName.toLowerCase() === profileLabel.toLowerCase(),
  );

  return (profile?.permissions ?? []).map(({ key, custody }) => ({
    permission_key: key,
    custody,
  }));
}

function profileRow(profileId: number) {
  const name = PROFILE_LABEL_BY_ID[profileId] ?? "Solicitante";

  return {
    profile_id: profileId,
    name,
    is_root: name === "Admin Root",
    is_active: true,
    is_assignable_triage: name === "Analista",
    is_assignable_mapping: name === "Analista",
  };
}

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(() => {
  vi.resetAllMocks();
  resetFakeDb();

  vi.mocked(auditLogger.recordAudit).mockImplementation(async (_trx, entry) => {
    fakeDbState.auditRows.push({
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action_type: entry.actionType,
      user_id: entry.userId,
      change_origin: entry.changeOrigin ?? null,
    });

    return String(fakeDbState.auditRows.length);
  });

  // Defaults realistas: o Administrador (id 1) é o ator; as linhas de conta
  // apontam para o Perfil Solicitante, salvo quando o teste define outro alvo.
  vi.mocked(authRepository.listUserPermissions).mockResolvedValue(
    permissionRowsFor("Administrador"),
  );
  vi.mocked(repository.findUserById).mockImplementation(async (id) =>
    id === 1
      ? makeAuthUser({
          user_id: 1,
          profile_name: "administrador",
          profile_id: PROFILE_IDS.Administrador,
        })
      : makeAuthUser({
          user_id: id,
          profile_name: "solicitante",
          profile_id: PROFILE_IDS.Solicitante,
        }),
  );
  vi.mocked(repository.findProfileById).mockImplementation(async (id) => profileRow(id));
  vi.mocked(repository.listProfilePermissions).mockImplementation(async (id) =>
    permissionRowsFor(PROFILE_LABEL_BY_ID[id] ?? "Solicitante"),
  );
  vi.mocked(repository.listOpenAssignedProtocolsForUser).mockResolvedValue([]);
});

afterAll(async () => {
  await server.close();
});

async function session(
  profileName: "solicitante" | "analista" | "gestor" | "administrador",
): Promise<Record<string, string>> {
  const profileLabel =
    Object.keys(PROFILE_IDS).find((label) => label.toLowerCase() === profileName) ?? "Analista";

  vi.mocked(authRepository.getAuthState).mockResolvedValue(
    makeAuthState({
      profile_name: profileName,
      profile_id: PROFILE_IDS[profileLabel] as number,
    }),
  );
  vi.mocked(authRepository.listUserPermissions).mockResolvedValue(permissionRowsFor(profileLabel));

  return { cookie: `session_id=${makeToken()}` };
}

describe("E2E — autorização de /users", () => {
  it("exige sessão para qualquer rota de usuários", async () => {
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/users?page=1");
    expectErrorEnvelope(response, { statusCode: 401 });
  });

  it("impede Solicitante de listar usuários", async () => {
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/users?page=1", await session("solicitante"));
    expectErrorEnvelope(response, {
      statusCode: 403,
      message: "Acesso restrito à permissão user:read",
    });
    expect(repository.listUsers).not.toHaveBeenCalled();
  });

  it("permite Administrador listar usuários e devolve a paginação", async () => {
    vi.mocked(repository.listUsers).mockResolvedValue(makeUserPage());
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/users?page=1&pageSize=10", await session("administrador"));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [makeUserSummary()],
      page: 1,
      total: 1,
    });
    expect(repository.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10 }),
    );
  });

  it("permite Administrador criar usuário e audita a operação", async () => {
    vi.mocked(repository.createUser).mockResolvedValue(
      makeUserRow({
        user_id: 10,
        full_name: "Novo Usuário",
        email: "novo@neo.com",
        profile_id: PROFILE_IDS.Solicitante as number,
        must_change_password: true,
      }),
    );
    vi.mocked(repository.createRequesterData).mockResolvedValue(undefined);

    const client = new TestClient(server.baseUrl);
    const response = await client.post(
      "/users",
      {
        fullName: "Novo Usuário",
        email: "novo@neo.com",
        profileId: String(PROFILE_IDS.Solicitante),
        requester: {
          area: "Financeiro",
          manager: "Gestor",
          additionalContact: "11999999999",
        },
      },
      await session("administrador"),
    );

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "10",
      fullName: "Novo Usuário",
      email: "novo@neo.com",
      profile: { id: String(PROFILE_IDS.Solicitante), name: "Solicitante" },
      isActive: true,
      mustChangePassword: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const createdBody = response.body as { temporaryPassword: string };
    expect(createdBody.temporaryPassword).toEqual(expect.any(String));
    expect(createdBody.temporaryPassword.length).toBeGreaterThanOrEqual(8);
    expect(repository.createRequesterData).toHaveBeenCalledOnce();
    expect(fakeDbState.auditRows[0]).toMatchObject({
      action_type: "user.create",
      entity_id: "10",
      change_origin: "admin",
    });
  });

  it("libera /users/me para qualquer perfil interno e devolve o perfil completo", async () => {
    const profile = makeUserProfile();
    vi.mocked(repository.findUserProfile).mockResolvedValue({
      user_id: 7,
      profile_id: PROFILE_IDS.Solicitante as number,
      full_name: profile.fullName,
      email: profile.email,
      avatar_url: null,
      profile_name: "Solicitante",
      is_active: true,
      is_assignable_triage: false,
      is_assignable_mapping: false,
      requester: {
        area: profile.requester?.area ?? null,
        department: profile.requester?.department ?? null,
        manager_name: profile.requester?.manager ?? null,
        additional_contact: profile.requester?.additionalContact ?? null,
      },
      professional: null,
    });

    const client = new TestClient(server.baseUrl);
    const response = await client.get("/users/me", await session("solicitante"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(profile);
  });

  it("libera a lista de analistas para perfis internos autenticados", async () => {
    const analysts = [makeAnalyst()];
    vi.mocked(repository.listAssignableProfessionals).mockResolvedValue(analysts);
    const client = new TestClient(server.baseUrl);

    const response = await client.get("/users/analysts", await session("analista"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(analysts);
    expect(repository.listAssignableProfessionals).toHaveBeenCalledWith("triage");
  });

  it("devolve 422 com fields para payload inválido de criação", async () => {
    const client = new TestClient(server.baseUrl);
    const response = await client.post(
      "/users",
      { fullName: "", email: "nao-email", profileId: String(PROFILE_IDS.Solicitante) },
      await session("administrador"),
    );

    expectErrorEnvelope(response, {
      statusCode: 422,
      fields: { fullName: "Campo obrigatório.", requester: "Campo obrigatório." },
    });
    expect(repository.createUser).not.toHaveBeenCalled();
  });

  it("impede não-admin de usar as rotas administrativas de /users/:id", async () => {
    const client = new TestClient(server.baseUrl);

    const response = await client.put("/users/9", { fullName: "X" }, await session("analista"));

    expectErrorEnvelope(response, {
      statusCode: 403,
      message: "Acesso restrito à permissão user:manage",
    });
    expect(repository.updateUserFields).not.toHaveBeenCalled();
  });

  it("consulta o perfil de um usuário pela rota administrativa", async () => {
    vi.mocked(repository.findUserProfile).mockResolvedValue({
      user_id: 7,
      profile_id: PROFILE_IDS.Solicitante as number,
      full_name: "Maria",
      email: "maria@neo.com",
      avatar_url: null,
      profile_name: "Solicitante",
      is_active: true,
      is_assignable_triage: false,
      is_assignable_mapping: false,
      requester: null,
      professional: null,
    });

    const client = new TestClient(server.baseUrl);
    const response = await client.get("/users/7", await session("administrador"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(makeUserProfile({ id: "7", requester: null }));
  });

  it("atualiza usuário pela rota administrativa com auditoria", async () => {
    const before = {
      user_id: 9,
      profile_id: PROFILE_IDS.Solicitante as number,
      full_name: "Maria",
      email: "maria@neo.com",
      avatar_url: null,
      profile_name: "Solicitante",
      is_active: true,
      is_assignable_triage: false,
      is_assignable_mapping: false,
      requester: null,
      professional: null,
    };
    const after = { ...before, full_name: "Maria Nova" };
    vi.mocked(repository.findUserById).mockResolvedValue(
      makeAuthUser({
        user_id: 9,
        full_name: "Maria",
        email: "maria@neo.com",
        profile_name: "solicitante",
        profile_id: PROFILE_IDS.Solicitante as number,
      }),
    );
    vi.mocked(repository.findUserProfile)
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce(after);

    const client = new TestClient(server.baseUrl);
    const response = await client.put(
      "/users/9",
      { fullName: "Maria Nova" },
      await session("administrador"),
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: "9", fullName: "Maria Nova" });
    expect(repository.updateUserFields).toHaveBeenCalledOnce();
    expect(repository.syncRequesterIdentity).toHaveBeenCalledOnce();
    expect(fakeDbState.auditRows[0]).toMatchObject({
      action_type: "user.update",
      entity_id: "9",
      change_origin: "admin",
    });
  });

  it("troca status pela rota administrativa", async () => {
    vi.mocked(repository.findUserById).mockResolvedValue(
      makeAuthUser({
        user_id: 9,
        is_active: true,
        profile_name: "solicitante",
        profile_id: PROFILE_IDS.Solicitante as number,
      }),
    );
    vi.mocked(repository.updateStatus).mockResolvedValue(undefined);

    const client = new TestClient(server.baseUrl);
    const response = await client.patch(
      "/users/9/status",
      { isActive: false },
      await session("administrador"),
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "9", isActive: false });
    expect(repository.updateStatus).toHaveBeenCalledOnce();
    expect(fakeDbState.auditRows[0]).toMatchObject({ action_type: "user.deactivate" });
  });

  it("redefine a senha pela rota administrativa e devolve a senha temporária", async () => {
    vi.mocked(repository.findUserById).mockResolvedValue(
      makeAuthUser({
        user_id: 9,
        profile_name: "solicitante",
        profile_id: PROFILE_IDS.Solicitante as number,
      }),
    );
    vi.mocked(repository.setTemporaryPassword).mockResolvedValue(undefined);

    const client = new TestClient(server.baseUrl);
    const response = await client.post(
      "/users/9/reset-password",
      undefined,
      await session("administrador"),
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: "9" });
    const resetBody = response.body as { temporaryPassword: string };
    expect(resetBody.temporaryPassword.length).toBeGreaterThanOrEqual(8);
    expect(repository.setTemporaryPassword).toHaveBeenCalledOnce();
    expect(fakeDbState.auditRows[0]).toMatchObject({ action_type: "user.reset_password" });
  });

  it("recusa avatar com extensão não permitida (415)", async () => {
    const client = new TestClient(server.baseUrl);
    const form = new FormData();
    form.append("payload", JSON.stringify({}));
    form.append("avatar", new File(["x"], "avatar.html", { type: "image/png" }));

    const response = await client.request("PUT", "/users/me", {
      rawBody: form,
      headers: await session("analista"),
    });

    expectErrorEnvelope(response, { statusCode: 415 });
    expect(repository.updateUserFields).not.toHaveBeenCalled();
  });

  it("atualiza o próprio perfil via PUT /users/me (multipart)", async () => {
    const before = {
      user_id: 1,
      profile_id: PROFILE_IDS.Analista as number,
      full_name: "Usuário de Teste",
      email: "teste@neo.com",
      avatar_url: null,
      profile_name: "Analista",
      is_active: true,
      is_assignable_triage: true,
      is_assignable_mapping: true,
      requester: null,
      professional: null,
    };
    const after = { ...before, full_name: "Usuário Atualizado" };
    vi.mocked(repository.findUserById).mockResolvedValue(makeAuthUser({ user_id: 1 }));
    vi.mocked(repository.findUserProfile)
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce(after);

    const client = new TestClient(server.baseUrl);
    const form = new FormData();
    form.append("payload", JSON.stringify({ fullName: "Usuário Atualizado" }));
    const response = await client.request("PUT", "/users/me", {
      rawBody: form,
      headers: await session("analista"),
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: "1", fullName: "Usuário Atualizado" });
    expect(repository.updateUserFields).toHaveBeenCalledOnce();
    expect(fakeDbState.auditRows[0]).toMatchObject({
      action_type: "user.update_profile",
      change_origin: "self",
    });
  });
});
