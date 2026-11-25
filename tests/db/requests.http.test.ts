import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
import { startTestServer, TestClient, type TestServer } from "../helpers/http.ts";
import { makeRequestPayload } from "../helpers/factories.ts";
import { closeTestDb, resetTestDb, testDb } from "../helpers/testDb.ts";
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
  await rm(Config.UPLOAD_DIR, { recursive: true, force: true });
  await closeTestDb();
});

describe("HTTP real — POST /requests multipart", () => {
  it("cria a solicitação com anexo e devolve o protocolo persistido", async () => {
    const client = new TestClient(server.baseUrl);
    const form = new FormData();
    form.append("payload", JSON.stringify(makeRequestPayload()));
    form.append(
      "attachments",
      new File([Buffer.from("%PDF-1.4 teste")], "documento.pdf", {
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
});
