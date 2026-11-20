import assert from "node:assert/strict";
import test from "node:test";
import { isComposedAuditAction, isAuditEntityName } from "../src/shared/audit/auditCatalog.ts";

test("status transitions accept human request actions", () => {
  assert.equal(isComposedAuditAction("request", "request.status_change"), true);
  assert.equal(isComposedAuditAction("request", "request.override_status_admin"), true);
});

test("status transitions accept triage and automatic request actions", () => {
  assert.equal(isComposedAuditAction("request", "request.triage"), true);
  assert.equal(isComposedAuditAction("request", "request.status_change"), true);
});

test("denied transitions use the request access_denied action", () => {
  assert.equal(isComposedAuditAction("request", "request.access_denied"), true);
});

test("request remains a valid audit entity", () => {
  assert.equal(isAuditEntityName("request"), true);
});
