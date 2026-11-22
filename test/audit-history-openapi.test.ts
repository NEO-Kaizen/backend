import assert from "node:assert/strict";
import test from "node:test";
import auditHistoryPaths from "../src/docs/paths/auditHistory.ts";
import { schemas } from "../src/docs/schemas/index.ts";

test("GET /audit-history documents its pagination filters and response envelope", () => {
  const operation = auditHistoryPaths["/audit-history"].get;
  assert.deepEqual(
    operation.parameters?.map((parameter) => parameter.name),
    ["page", "limit", "entityType"],
  );
  assert.equal(operation.parameters?.[0]?.schema.minimum, 1);
  assert.equal(operation.parameters?.[1]?.schema.maximum, 100);
  assert.ok(operation.parameters?.[2]?.schema.enum?.includes("prioritization"));
  assert.equal(
    operation.responses["200"].content["application/json"].schema.$ref,
    "#/components/schemas/AuditHistoryListResponse",
  );

  const responseSchema = schemas.AuditHistoryListResponse;
  assert.deepEqual(responseSchema.required, ["items", "total", "page", "limit"]);
  assert.deepEqual(responseSchema.properties.items.items, {
    $ref: "#/components/schemas/AuditHistorySummary",
  });
});

test("audit-history 403 responses describe only the permitted roles", () => {
  const expectedDescription = "Perfil diferente de Administrador ou Gestor.";
  assert.equal(
    auditHistoryPaths["/audit-history"].get.responses["403"].description,
    expectedDescription,
  );
  assert.equal(
    auditHistoryPaths["/audit-history/{id}"].get.responses["403"].description,
    expectedDescription,
  );
});
