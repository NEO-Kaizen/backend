import assert from "node:assert/strict";
import test from "node:test";
import portalConfigPaths from "../src/docs/paths/portalConfig.ts";
import { schemas } from "../src/docs/schemas/index.ts";

test("portal Status returns isPaused as read-only and excludes it from PATCH", () => {
  assert.ok(schemas.PortalStatus.required.includes("isPaused"));
  assert.equal(schemas.PortalStatus.properties.isPaused.readOnly, true);
  assert.equal(Object.hasOwn(schemas.PortalStatusPatch.properties, "isPaused"), false);
  assert.deepEqual(
    portalConfigPaths["/portal-config/statuses"].patch.requestBody.content["application/json"]
      .schema.properties.statuses.items,
    { $ref: "#/components/schemas/PortalStatusPatch" },
  );
});
