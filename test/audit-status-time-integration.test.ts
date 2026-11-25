import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import db from "../src/database/conection.ts";
import { recordAudit } from "../src/shared/audit/auditLogger.ts";

const hasDatabaseConfig =
  Boolean(process.env.DB_HOST) &&
  Boolean(process.env.DB_NAME) &&
  Boolean(process.env.DB_USER) &&
  Boolean(process.env.DB_PASSWORD);
const canRunHttpIntegration = hasDatabaseConfig && Boolean(process.env.JWT_SECRET);
const protocol = "MAAT-8K3P-9X2M";

interface TestAccount {
  user_id: number;
  email: string;
  full_name: string;
  password_changed_at: Date;
}

interface TestContext {
  baseUrl: string;
  cookieName: string;
  admin: TestAccount;
  adminToken: string;
  closeServer: () => Promise<void>;
  createToken: (account: TestAccount, role: "Administrador" | "Analista" | "Gestor") => string;
}

let context: TestContext | undefined;

function getContext(): TestContext {
  assert.ok(context, "o servidor de teste deve estar iniciado");
  return context;
}

describe(
  "integração HTTP de auditoria e transições de Status",
  { skip: !canRunHttpIntegration },
  () => {
    before(async () => {
      const admin = await db("users as u")
        .join("profiles as p", "p.profile_id", "u.profile_id")
        .whereRaw("lower(p.name) = ?", ["administrador"])
        .first<TestAccount>("u.user_id", "u.email", "u.full_name", "u.password_changed_at");
      assert.ok(admin, "o seed deve disponibilizar um usuário Administrador");

      const [{ generateToken }, { app }, { default: Config }] = await Promise.all([
        import("../src/shared/utils/jwtUtil.ts"),
        import("../src/app.ts"),
        import("../src/configs.ts"),
      ]);
      const createToken: TestContext["createToken"] = (account, role) =>
        generateToken({
          id: String(account.user_id),
          name: account.full_name,
          email: account.email,
          role,
          password_changed_at: new Date(account.password_changed_at).getTime(),
        });

      const server = app.listen(0, "127.0.0.1");
      await new Promise<void>((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
      });
      const address = server.address();
      assert.ok(address && typeof address !== "string");

      context = {
        baseUrl: `http://127.0.0.1:${address.port}`,
        cookieName: Config.COOKIE_NAME,
        admin,
        adminToken: createToken(admin, "Administrador"),
        createToken,
        closeServer: () =>
          new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
          }),
      };
    });

    after(async () => {
      if (context) await context.closeServer();
    });

    it("GET /audit-history returns the filtered paginated envelope and detail", async () => {
      const { baseUrl, cookieName, adminToken } = getContext();
      const response = await fetch(`${baseUrl}/audit-history?page=1&limit=1&entityType=request`, {
        headers: { Cookie: `${cookieName}=${adminToken}` },
      });
      assert.equal(response.status, 200);
      const result = (await response.json()) as {
        items: Array<{ audit_id: number; entity_type: string; entity_type_label: string }>;
        total: number;
        page: number;
        limit: number;
      };
      assert.equal(result.page, 1);
      assert.equal(result.limit, 1);
      assert.ok(result.total > 0);
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0]?.entity_type, "request");
      assert.equal(result.items[0]?.entity_type_label, "Solicitações");

      const detailResponse = await fetch(`${baseUrl}/audit-history/${result.items[0]?.audit_id}`, {
        headers: { Cookie: `${cookieName}=${adminToken}` },
      });
      assert.equal(detailResponse.status, 200);
      const detail = (await detailResponse.json()) as {
        entity_type: string;
        actor: { kind: string };
      };
      assert.equal(detail.entity_type, "request");
      assert.ok(["system", "user"].includes(detail.actor.kind));
    });

    it("GET /audit-logs/:protocol and status-times return seeded history", async () => {
      const { baseUrl, cookieName, adminToken } = getContext();
      const headers = { Cookie: `${cookieName}=${adminToken}` };

      const timelineResponse = await fetch(`${baseUrl}/audit-logs/${protocol}`, { headers });
      assert.equal(timelineResponse.status, 200);
      const timeline = (await timelineResponse.json()) as Array<{ action_type: string }>;
      assert.ok(timeline.some((event) => event.action_type === "request.status_change"));

      const timesResponse = await fetch(`${baseUrl}/audit-logs/${protocol}/status-times`, {
        headers,
      });
      assert.equal(timesResponse.status, 200);
      const result = (await timesResponse.json()) as {
        protocol: string;
        intervals: Array<{ status: string; exitedAt: string | null }>;
        totalActiveMilliseconds: number;
      };
      assert.equal(result.protocol, protocol);
      assert.ok(result.totalActiveMilliseconds > 0);
      assert.equal(result.intervals.at(-1)?.status, "Aguardando mapeamento");
      assert.equal(result.intervals.at(-1)?.exitedAt, null);
    });

    it("GET /audit-logs/:protocol/status-times keeps terminal totals fixed", async (t) => {
      const { baseUrl, cookieName, adminToken, admin } = getContext();
      const request = await db("requests as r")
        .join("statuses as s", "s.status_id", "r.status_id")
        .where("r.protocol", protocol)
        .first<{ status_id: number; name: string; is_terminal: boolean }>(
          "r.status_id",
          "s.name",
          "s.is_terminal",
        );
      assert.ok(request);
      assert.equal(request.is_terminal, false);

      const terminalStatus = await db("statuses")
        .where({ is_terminal: true })
        .orderBy("status_id")
        .first<{ status_id: number; name: string }>("status_id", "name");
      assert.ok(terminalStatus, "deve haver um Status terminal no seed");

      const recordTransition = async (
        previousStatus: string,
        nextStatus: string,
        nextStatusId: number,
      ): Promise<string> =>
        db.transaction(async (trx) => {
          const auditId = await recordAudit(trx, {
            entityType: "request",
            entityId: protocol,
            actionType: "request.override_status_admin",
            userId: admin.user_id,
            previousValue: previousStatus,
            newValue: nextStatus,
            note: "Transição de fixture para teste de integração.",
            changeOrigin: "admin",
          });
          await trx("requests").where({ protocol }).update({ status_id: nextStatusId });
          const audit = await trx("audit_history")
            .where({ audit_id: auditId })
            .first<{ occurred_at: Date | string }>("occurred_at");
          assert.ok(audit);
          return audit.occurred_at instanceof Date
            ? audit.occurred_at.toISOString()
            : new Date(audit.occurred_at).toISOString();
        });

      let transitionCommitted = false;
      try {
        const terminalEnteredAt = await recordTransition(
          request.name,
          terminalStatus.name,
          terminalStatus.status_id,
        );
        transitionCommitted = true;

        const firstQueryTime = new Date(
          Math.max(Date.now(), Date.parse(terminalEnteredAt)) + 1_000,
        );
        t.mock.timers.enable({
          apis: ["Date"],
          now: firstQueryTime,
        });
        const headers = { Cookie: `${cookieName}=${adminToken}` };
        const firstResponse = await fetch(
          `${baseUrl}/audit-logs/${protocol}/status-times`,
          { headers },
        );
        assert.equal(firstResponse.status, 200);
        const first = (await firstResponse.json()) as {
          calculatedAt: string;
          intervals: Array<{
            status: string;
            enteredAt: string;
            exitedAt: string | null;
            activeMilliseconds: number;
            pausedMilliseconds: number;
          }>;
          totalActiveMilliseconds: number;
          totalPausedMilliseconds: number;
        };

        t.mock.timers.setTime(firstQueryTime.getTime() + 1_000);
        const secondResponse = await fetch(
          `${baseUrl}/audit-logs/${protocol}/status-times`,
          { headers },
        );
        assert.equal(secondResponse.status, 200);
        const second = (await secondResponse.json()) as typeof first;

        const terminalInterval = first.intervals.at(-1);
        assert.equal(first.calculatedAt === second.calculatedAt, false);
        assert.equal(terminalInterval?.status, terminalStatus.name);
        assert.equal(terminalInterval?.enteredAt, terminalEnteredAt);
        assert.equal(terminalInterval?.exitedAt, terminalEnteredAt);
        assert.equal(terminalInterval?.activeMilliseconds, 0);
        assert.equal(terminalInterval?.pausedMilliseconds, 0);
        assert.equal(first.totalActiveMilliseconds, second.totalActiveMilliseconds);
        assert.equal(first.totalPausedMilliseconds, second.totalPausedMilliseconds);
      } finally {
        t.mock.timers.reset();
        if (transitionCommitted) {
          await recordTransition(terminalStatus.name, request.name, request.status_id);
        }
      }
    });

    it("GET /audit-history rejects roles outside Administrador and Gestor", async () => {
      const { baseUrl, cookieName, createToken } = getContext();
      const analyst = await db("users as u")
        .join("profiles as p", "p.profile_id", "u.profile_id")
        .whereRaw("lower(p.name) = ?", ["analista"])
        .first<TestAccount>("u.user_id", "u.email", "u.full_name", "u.password_changed_at");
      assert.ok(analyst, "o seed deve disponibilizar um usuário Analista");

      const response = await fetch(`${baseUrl}/audit-history`, {
        headers: { Cookie: `${cookieName}=${createToken(analyst, "Analista")}` },
      });
      assert.equal(response.status, 403);
      const body = (await response.json()) as { message: string };
      assert.match(body.message, /Acesso restrito/);
    });

    it("PATCH /portal-config/statuses rejects pause changes and preserves pause configuration", async () => {
      const { baseUrl, cookieName, adminToken } = getContext();
      const configResponse = await fetch(`${baseUrl}/portal-config`);
      assert.equal(configResponse.status, 200);
      const config = (await configResponse.json()) as {
        statuses: Array<{
          id: number;
          name: string;
          isCore: boolean;
          isPublic: boolean;
          isTerminal: boolean;
          isPaused: boolean;
          triageMode: string;
          mappingMode: string;
          isRestricted: boolean;
          tone: string;
          isActive: boolean;
        }>;
      };
      const configurableStatus = config.statuses.find((status) => !status.isCore);
      assert.ok(configurableStatus, "deve haver um Status configurável no seed");
      const pauseChangeStatuses = config.statuses.map((status) =>
        status.id === configurableStatus.id ? { ...status, isPaused: !status.isPaused } : status,
      );
      const rejectedResponse = await fetch(`${baseUrl}/portal-config/statuses`, {
        method: "PATCH",
        headers: {
          Cookie: `${cookieName}=${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statuses: pauseChangeStatuses }),
      });
      assert.equal(rejectedResponse.status, 400);

      const statusesWithoutPauseFlag = config.statuses.map((status) => {
        const { isPaused, ...patchStatus } = status;
        assert.equal(typeof isPaused, "boolean");
        return patchStatus;
      });
      const updateResponse = await fetch(`${baseUrl}/portal-config/statuses`, {
        method: "PATCH",
        headers: {
          Cookie: `${cookieName}=${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statuses: statusesWithoutPauseFlag }),
      });
      assert.equal(updateResponse.status, 200);
      const updatedConfig = (await updateResponse.json()) as {
        statuses: Array<{ id: number; isPaused: boolean }>;
      };
      assert.equal(
        updatedConfig.statuses.find((status) => status.id === configurableStatus.id)?.isPaused,
        configurableStatus.isPaused,
      );
    });

    it("PATCH /requests/:protocol/status records an authorized human transition", async () => {
      const { baseUrl, cookieName, createToken, adminToken } = getContext();
      const request = await db("requests as r")
        .join("details_professional as p", "p.professional_id", "r.professional_id")
        .where("r.protocol", protocol)
        .first<{ request_id: number; status_id: number; assignee_user_id: number }>(
          "r.request_id",
          "r.status_id",
          "p.user_id as assignee_user_id",
        );
      assert.ok(request);
      const analyst = await db("users as u")
        .join("profiles as p", "p.profile_id", "u.profile_id")
        .where("u.user_id", request.assignee_user_id)
        .first<TestAccount & { profile_name: string }>(
          "u.user_id",
          "u.email",
          "u.full_name",
          "u.password_changed_at",
          "p.name as profile_name",
        );
      assert.ok(analyst);
      assert.equal(analyst.profile_name.toLowerCase(), "analista");
      const target = await db("statuses")
        .where({
          is_active: true,
          is_terminal: false,
          is_restricted: false,
          is_public: false,
        })
        .whereNot("status_id", request.status_id)
        .andWhere((builder) => builder.where("triage_mode", "free").orWhere("mapping_mode", "free"))
        .orderBy("status_id")
        .first<{ status_id: number; name: string }>("status_id", "name");
      assert.ok(target, "deve haver um Status interno acessível ao Analista");

      let transitionCommitted = false;
      try {
        const response = await fetch(`${baseUrl}/requests/${protocol}/status`, {
          method: "PATCH",
          headers: {
            Cookie: `${cookieName}=${createToken(analyst, "Analista")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetStatus: target.status_id,
            justification: "Validação de integração da auditoria.",
            lastTechnicalMessage: "Validação de integração.",
          }),
        });
        transitionCommitted = response.status === 200;
        assert.equal(response.status, 200);
        const body = (await response.json()) as {
          protocol: string;
          previous: string;
          next: string;
          lastUpdate: string;
        };
        assert.equal(body.protocol, protocol);
        assert.equal(body.previous, "Aguardando mapeamento");
        assert.equal(body.next, target.name);
        assert.ok(Number.isFinite(Date.parse(body.lastUpdate)));
        const auditEvent = await db("audit_history")
          .where({
            entity_type: "request",
            entity_id: protocol,
            action_type: "request.status_change",
            user_id: analyst.user_id,
            status_id: target.status_id,
          })
          .first("audit_id");
        assert.ok(auditEvent, "a transição deve gravar o snapshot de Status");
      } finally {
        if (transitionCommitted) {
          const restoreResponse = await fetch(`${baseUrl}/requests/${protocol}/status`, {
            method: "PATCH",
            headers: {
              Cookie: `${cookieName}=${adminToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              targetStatus: request.status_id,
              justification: "Restaurar estado do seed.",
              lastTechnicalMessage: "Validação de integração.",
            }),
          });
          assert.equal(restoreResponse.status, 200);
        }
      }
    });

    it("PATCH /requests/:protocol/status returns the denied response and records the attempt", async () => {
      const { baseUrl, cookieName, createToken } = getContext();
      const manager = await db("users as u")
        .join("profiles as p", "p.profile_id", "u.profile_id")
        .whereRaw("lower(p.name) = ?", ["gestor"])
        .first<TestAccount>("u.user_id", "u.email", "u.full_name", "u.password_changed_at");
      assert.ok(manager, "o seed deve disponibilizar um usuário Gestor");
      const request = await db("requests")
        .where({ protocol })
        .first<{ status_id: number }>("status_id");
      assert.ok(request);
      const target = await db("statuses")
        .where({ is_active: true, is_terminal: false })
        .whereNot("status_id", request.status_id)
        .orderBy("status_id")
        .first<{ status_id: number }>("status_id");
      assert.ok(target, "deve haver um Status de destino para a tentativa negada");

      const response = await fetch(`${baseUrl}/requests/${protocol}/status`, {
        method: "PATCH",
        headers: {
          Cookie: `${cookieName}=${createToken(manager, "Gestor")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetStatus: target.status_id,
          justification: "Validar tentativa negada.",
        }),
      });
      assert.equal(response.status, 403);
      const body = (await response.json()) as {
        status: string;
        statusCode: number;
        code: string;
      };
      assert.equal(body.status, "error");
      assert.equal(body.statusCode, 403);
      assert.equal(body.code, "INSUFFICIENT_ROLE_PERMISSIONS");
      const deniedEvent = await db("audit_history")
        .where({
          entity_type: "request",
          entity_id: protocol,
          action_type: "request.access_denied",
          user_id: manager.user_id,
        })
        .orderBy("audit_id", "desc")
        .first("audit_id");
      assert.ok(deniedEvent);
    });

    it("PATCH /requests/:protocol/pending-items/:id records an automatic transition as system", async () => {
      const { baseUrl } = getContext();
      const request = await db("requests")
        .where({ protocol })
        .first<{ request_id: number }>("request_id");
      assert.ok(request);
      const requester = await db("requests as r")
        .join("requesters as q", "q.requester_id", "r.requester_id")
        .where("r.protocol", protocol)
        .first<{ full_name: string; corporate_email: string }>("q.full_name", "q.corporate_email");
      assert.ok(requester);

      const response = await fetch(
        `${baseUrl}/requests/${protocol}/pending-items/00000000-0000-4000-8000-000000000099`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Requester-Identity": JSON.stringify({
              name: requester.full_name,
              email: requester.corporate_email,
            }),
          },
          body: JSON.stringify({
            response: "Complemento enviado para validar a transição automática.",
          }),
        },
      );
      assert.equal(response.status, 200);
      const body = (await response.json()) as { status: string };
      assert.equal(body.status, "responded");

      const automaticTarget = await db("statuses")
        .where({ name: "Em triagem" })
        .first<{ status_id: number }>("status_id");
      assert.ok(automaticTarget);
      const automaticEvent = await db("audit_history")
        .where({
          entity_type: "request",
          entity_id: protocol,
          action_type: "request.status_change",
          status_id: automaticTarget.status_id,
        })
        .orderBy("audit_id", "desc")
        .first<{ user_id: number | null; change_origin: string; transaction_id: string }>(
          "user_id",
          "change_origin",
          "transaction_id",
        );
      assert.ok(automaticEvent);
      assert.equal(automaticEvent.user_id, null);
      assert.equal(automaticEvent.change_origin, "system");
      assert.ok(automaticEvent.transaction_id);
    });
  },
);

after(async () => {
  await db.destroy();
});
