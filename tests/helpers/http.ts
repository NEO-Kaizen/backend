import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { rm } from "node:fs/promises";
import path from "node:path";
import { expect } from "vitest";
import { app } from "../../src/app.ts";
import Config from "../../src/configs.ts";

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

/**
 * Sobe o app Express em uma porta efêmera (0) e devolve a base URL.
 * Cada arquivo de teste E2E cria e derruba o seu servidor no `beforeAll`/
 * `afterAll`, garantindo isolamento entre arquivos.
 */
export async function startTestServer(): Promise<TestServer> {
  const server: Server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });

  const address = server.address() as AddressInfo;
  let closed = false;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      if (closed) return;
      closed = true;
      server.closeIdleConnections();
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

/**
 * Remove o diretório temporário de uploads com fail-closed: nunca apaga um
 * diretório que não tenha o prefixo dos testes.
 */
export async function cleanupTestUploads(): Promise<void> {
  const uploadDir = path.resolve(Config.UPLOAD_DIR);

  if (!path.basename(uploadDir).startsWith("neo-kaizen-test-uploads-")) {
    throw new Error(`Recusando remover UPLOAD_DIR fora do padrão de testes: "${uploadDir}".`);
  }

  await rm(uploadDir, { recursive: true, force: true });
}

export interface HttpResult<T = unknown> {
  status: number;
  headers: Headers;
  body: T;
  text: string;
}

export interface CookieRecord {
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string | null;
  path: string | null;
  maxAge: number | null;
  expires: Date | null;
  raw: string;
}

function parseSetCookie(raw: string): { name: string; cookie: CookieRecord } | null {
  const [pair, ...attributes] = raw.split(";");
  const separator = pair?.indexOf("=") ?? -1;

  if (!pair || separator <= 0) return null;

  const name = pair.slice(0, separator).trim();
  const value = pair.slice(separator + 1).trim();
  const parsed: CookieRecord = {
    value,
    httpOnly: false,
    secure: false,
    sameSite: null,
    path: null,
    maxAge: null,
    expires: null,
    raw,
  };

  for (const attribute of attributes) {
    const [rawKey, ...rest] = attribute.split("=");
    const key = rawKey?.trim().toLowerCase();
    const attributeValue = rest.join("=").trim();

    if (key === "httponly") parsed.httpOnly = true;
    if (key === "secure") parsed.secure = true;
    if (key === "samesite") parsed.sameSite = attributeValue;
    if (key === "path") parsed.path = attributeValue;
    if (key === "max-age") parsed.maxAge = Number(attributeValue);
    if (key === "expires") parsed.expires = new Date(attributeValue);
  }

  return { name, cookie: parsed };
}

/**
 * Cliente HTTP com cookie jar simples — preserva o `session_id` (HttpOnly)
 * entre as requisições, como um navegador faria, e expõe os atributos dos
 * `Set-Cookie` para que os testes validem Path/HttpOnly/SameSite/Secure.
 */
export class TestClient {
  private readonly cookies = new Map<string, CookieRecord>();
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get cookieHeader(): string {
    return [...this.cookies.entries()]
      .map(([name, cookie]) => `${name}=${cookie.value}`)
      .join("; ");
  }

  getCookie(name: string): CookieRecord | undefined {
    return this.cookies.get(name);
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      headers?: Record<string, string>;
      rawBody?: string | FormData | URLSearchParams;
      timeoutMs?: number;
    } = {},
  ): Promise<HttpResult<T>> {
    const headers: Record<string, string> = { ...options.headers };

    // Header explícito vence o jar: permite simular um cookie antigo/paralelo
    // sem criar outro cliente só para isso.
    if (this.cookies.size > 0 && headers["cookie"] === undefined) {
      headers["cookie"] = this.cookieHeader;
    }

    let body: string | FormData | URLSearchParams | undefined;
    if (options.rawBody !== undefined) {
      body = options.rawBody;
    } else if (options.body !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(options.timeoutMs ?? 5_000),
    });

    for (const header of response.headers.getSetCookie()) {
      const parsed = parseSetCookie(header);
      if (!parsed) continue;

      const removed =
        parsed.cookie.value === "" &&
        (parsed.cookie.maxAge === 0 ||
          (parsed.cookie.expires !== null && parsed.cookie.expires.getTime() <= Date.now()));

      if (removed) {
        this.cookies.delete(parsed.name);
      } else {
        this.cookies.set(parsed.name, parsed.cookie);
      }
    }

    const text = await response.text();
    let parsedBody: unknown = text;
    if (text.length > 0) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text;
      }
    }

    return {
      status: response.status,
      headers: response.headers,
      body: parsedBody as T,
      text,
    };
  }

  get<T = unknown>(path: string, headers?: Record<string, string>) {
    return this.request<T>("GET", path, { headers });
  }

  post<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>("POST", path, { body, headers });
  }

  put<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>("PUT", path, { body, headers });
  }

  patch<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>("PATCH", path, { body, headers });
  }

  del<T = unknown>(path: string, headers?: Record<string, string>) {
    return this.request<T>("DELETE", path, { headers });
  }
}

export interface ErrorEnvelope {
  status: "error";
  statusCode: number;
  message: string;
  fields?: Record<string, string>;
}

/** Valida o envelope padrão de erro (`errorHandler`) e o content-type JSON. */
export function expectErrorEnvelope<T>(
  result: HttpResult<T>,
  expected: { statusCode: number; message?: string | RegExp; fields?: Record<string, string> },
): void {
  expect(result.headers.get("content-type")).toContain("application/json");
  expect(result.body).toMatchObject({
    status: "error",
    statusCode: expected.statusCode,
  });

  const body = result.body as ErrorEnvelope;

  if (expected.message !== undefined) {
    if (typeof expected.message === "string") {
      expect(body.message).toBe(expected.message);
    } else {
      expect(body.message).toMatch(expected.message);
    }
  }

  if (expected.fields !== undefined) {
    expect(body.fields).toMatchObject(expected.fields);
  }
}
