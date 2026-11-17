import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app } from "../../src/app.ts";

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
  const server: Server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export interface HttpResult<T = unknown> {
  status: number;
  headers: Headers;
  body: T;
  text: string;
}

/**
 * Cliente HTTP com cookie jar simples — preserva o `session_id` (HttpOnly)
 * entre as requisições, como um navegador faria.
 */
export class TestClient {
  private readonly cookies = new Map<string, string>();
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get cookieHeader(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: { body?: unknown; headers?: Record<string, string>; rawBody?: string | FormData } = {},
  ): Promise<HttpResult<T>> {
    const headers: Record<string, string> = { ...options.headers };

    if (this.cookies.size > 0) {
      headers["cookie"] = this.cookieHeader;
    }

    let body: string | FormData | undefined;
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
    });

    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const separator = pair?.indexOf("=") ?? -1;
      if (pair && separator > 0) {
        const name = pair.slice(0, separator);
        const value = pair.slice(separator + 1);
        if (value === "") {
          this.cookies.delete(name);
        } else {
          this.cookies.set(name, value);
        }
      }
    }

    const text = await response.text();
    let parsed: unknown = text;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    return {
      status: response.status,
      headers: response.headers,
      body: parsed as T,
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
