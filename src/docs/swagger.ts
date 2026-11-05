import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

import { openapiBase } from "./openapi.ts";
import { schemas } from "./schemas/index.ts";
import { securitySchemes } from "./components/security.ts";
import { paths } from "./paths/index.ts";

/**
 * Especificação OpenAPI 3.0.1 do backend MAAT.
 *
 * Documenta apenas os endpoints existentes, sem criar rotas fictícias.
 * A autenticação é feita por cookie HttpOnly (`session_id`) com JWT.
 * Para testar endpoints protegidos no Swagger UI, primeiro chame
 * `POST /auth/login` — o servidor define o cookie e o navegador o envia
 * automaticamente nas requisições subsequentes.
 */

export const openapiSpec = {
  ...openapiBase,
  components: {
    securitySchemes,
    schemas,
  },
  paths,
} as const;

export const swaggerOptions = {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "MAAT API — Documentação",
};

/**
 * Monta o Swagger UI na aplicação Express.
 * Disponível em `GET /api-docs` (UI) e `GET /api-docs/swagger.json` (JSON).
 */
export function setupSwagger(app: Express): void {
  // Rota do JSON deve ser registrada ANTES do middleware estatico do swagger-ui,
  // para que /api-docs/swagger.json retorne o JSON da especificação e não o HTML da UI.
  app.get("/api-docs/swagger.json", (_req, res) => {
    res.type("application/json").json(openapiSpec);
  });
  app.use(
    "/api-docs",
    ...swaggerUi.serve,
    swaggerUi.setup(openapiSpec as unknown as Record<string, unknown>, swaggerOptions),
  );
}
