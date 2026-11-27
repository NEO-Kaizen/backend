import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  cleanupTestUploads,
  startTestServer,
  TestClient,
  type TestServer,
} from "../helpers/http.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, insertUser, resetTestDb, testDb } from "../helpers/testDb.ts";
import Config from "../../src/configs.ts";

vi.mock("../../src/database/conection.ts", async () => {
  const { testDb } = await import("../helpers/testDb.ts");
  return { default: testDb };
});

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await server.close();
  await cleanupTestUploads();
  await closeTestDb();
});

describe("HTTP real — POST /requests multipart", () => {
  it("cria a solicitação com anexo e devolve o protocolo persistido", async () => {
    const client = new TestClient(server.baseUrl);
    const content = Buffer.from("%PDF-1.4 teste");
    const form = new FormData();
    form.append("payload", JSON.stringify(makeRequestPayload()));
    form.append(
      "attachments",
      new File([content], "documento.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await client.request("POST", "/requests", { rawBody: form });

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = response.body as { protocol: string; status: string };
    expect(body.protocol).toMatch(/^MAAT-[0-9A-Z]{4}-[0-9A-Z]{4}$/);

    const request = await testDb("requests").where({ protocol: body.protocol }).first();
    expect(request).toMatchObject({
      title: "Automatizar conciliação",
      need_description: "Descrição detalhada do processo e do problema.",
    });

    const attachments = await testDb("attachments").where({ request_id: request.request_id });
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      file_name: "documento.pdf",
      content_type: "application/pdf",
      uploaded_by: "maria@neo.com",
    });
    // BIGINT chega como string no driver pg.
    expect(Number(attachments[0].size_bytes)).toBe(content.byteLength);
    await expect(
      readFile(path.join(Config.UPLOAD_DIR, attachments[0].file_path), "utf8"),
    ).resolves.toBe(content.toString("utf8"));

    const listing = await client.get(`/requests?email=${encodeURIComponent("maria@neo.com")}`);
    expect(listing.status).toBe(200);
    expect(listing.body).toMatchObject({
      total: 1,
      data: [{ protocol: body.protocol }],
    });
  });

  it("recusa anexo com MIME não permitido antes de persistir", async () => {
    const client = new TestClient(server.baseUrl);
    const form = new FormData();
    form.append("payload", JSON.stringify(makeRequestPayload()));
    form.append("attachments", new File(["texto"], "nota.txt", { type: "text/plain" }));

    const response = await client.request("POST", "/requests", { rawBody: form });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 400,
      message: expect.stringContaining("Formato de arquivo não permitido"),
    });
    await expect(testDb("requests")).resolves.toHaveLength(0);
  });

  it("recusa extensão não permitida antes de persistir", async () => {
    const client = new TestClient(server.baseUrl);
    const form = new FormData();
    form.append("payload", JSON.stringify(makeRequestPayload()));
    form.append(
      "attachments",
      new File([Buffer.from("<script>alert(1)</script>")], "malicioso.html", {
        type: "application/pdf",
      }),
    );

    const response = await client.request("POST", "/requests", { rawBody: form });

    expect(response.status).toBe(400);
    await expect(testDb("requests")).resolves.toHaveLength(0);
    await expect(testDb("attachments")).resolves.toHaveLength(0);
  });

  it("no modo AUTHENTICATED lista pela sessão e recusa ?email", async () => {
    const user = await insertUser({
      email: "maria@neo.com",
      profileName: "solicitante",
    });
    await testDb("system_settings")
      .where({ settings_id: 1 })
      .update({ solicitation_mode: "AUTHENTICATED" });

    const client = new TestClient(server.baseUrl);
    const login = await client.post("/auth/login", {
      email: "maria@neo.com",
      password: "SenhaTeste@123",
    });
    expect(login.status).toBe(200);

    const withEmail = await client.get("/requests?email=maria@neo.com");
    expect(withEmail.status).toBe(400);
    expect(withEmail.body).toMatchObject({
      message: "O parâmetro 'email' não é aceito com sessão autenticada.",
    });

    const scoped = await client.get("/requests?page=1&pageSize=10");
    expect(scoped.status).toBe(200);
    expect(scoped.body).toMatchObject({ page: 1, pageSize: 10 });

    const sessionToken = client.getCookie("session_id")?.value;
    expect(sessionToken).toBeTruthy();
    await testDb("users").where({ user_id: user.user_id }).update({ is_active: false });

    const deactivated = new TestClient(server.baseUrl);
    const blocked = await deactivated.get("/requests", {
      cookie: `session_id=${sessionToken}`,
    });
    expect(blocked.status).toBe(401);
  });
});
