import assert from "node:assert/strict";
import test from "node:test";
import db from "../src/database/conection.ts";

const hasDatabaseConfig =
  Boolean(process.env.DB_HOST) &&
  Boolean(process.env.DB_NAME) &&
  Boolean(process.env.DB_USER) &&
  Boolean(process.env.DB_PASSWORD);
const canRunHttpIntegration = hasDatabaseConfig && Boolean(process.env.JWT_SECRET);

test(
  "GET status-times calcula a timeline semeada pela rota HTTP",
  { skip: !canRunHttpIntegration },
  async () => {
    const user = await db("users")
      .where({ user_id: 102 })
      .first<{ user_id: number; full_name: string; email: string; password_changed_at: Date }>(
        "user_id",
        "full_name",
        "email",
        "password_changed_at",
      );
    assert.ok(user, "o usuário Administrador de teste deve existir no seed");

    const [{ generateToken }, { app }, { default: Config }] = await Promise.all([
      import("../src/shared/utils/jwtUtil.ts"),
      import("../src/app.ts"),
      import("../src/configs.ts"),
    ]);
    const createToken = (
      account: {
        user_id: number;
        full_name: string;
        email: string;
        password_changed_at: Date;
      },
      role: "Administrador" | "Analista" | "Gestor",
    ) =>
      generateToken({
        id: String(account.user_id),
        name: account.full_name,
        email: account.email,
        role,
        password_changed_at: new Date(account.password_changed_at).getTime(),
      });
    const adminToken = createToken(user, "Administrador");

    const server = app.listen(0, "127.0.0.1");
    try {
      await new Promise<void>((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
      });
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      const response = await fetch(
        `http://127.0.0.1:${address.port}/audit-logs/MAAT-8K3P-9X2M/status-times`,
        { headers: { Cookie: `${Config.COOKIE_NAME}=${adminToken}` } },
      );
      assert.equal(response.status, 200);

      const result = (await response.json()) as {
        protocol: string;
        intervals: Array<{ status: string; exitedAt: string | null }>;
        totalActiveMilliseconds: number;
      };
      assert.equal(result.protocol, "MAAT-8K3P-9X2M");
      assert.ok(result.totalActiveMilliseconds > 0);
      assert.equal(result.intervals.at(-1)?.status, "Aguardando mapeamento");
      assert.equal(result.intervals.at(-1)?.exitedAt, null);

      const auditTimelineResponse = await fetch(
        `http://127.0.0.1:${address.port}/audit-logs/MAAT-8K3P-9X2M`,
        { headers: { Cookie: `${Config.COOKIE_NAME}=${adminToken}` } },
      );
      assert.equal(auditTimelineResponse.status, 200);
      const auditTimeline = (await auditTimelineResponse.json()) as Array<{
        action_type: string;
      }>;
      assert.ok(auditTimeline.some((event) => event.action_type === "request.status_change"));

      const configResponse = await fetch(`http://127.0.0.1:${address.port}/portal-config`);
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
      assert.ok(config.statuses.length > 0);
      assert.ok(config.statuses.every((status) => typeof status.isPaused === "boolean"));
      const configurableStatus = config.statuses.find((status) => !status.isCore);
      assert.ok(configurableStatus, "deve haver um Status configurável no seed");
      const updatedStatuses = config.statuses.map((status) =>
        status.id === configurableStatus.id ? { ...status, isPaused: !status.isPaused } : status,
      );
      let pauseConfigChanged = false;
      try {
        const updateConfigResponse = await fetch(
          `http://127.0.0.1:${address.port}/portal-config/statuses`,
          {
            method: "PATCH",
            headers: {
              Cookie: `${Config.COOKIE_NAME}=${adminToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ statuses: updatedStatuses }),
          },
        );
        pauseConfigChanged = updateConfigResponse.status === 200;
        assert.equal(updateConfigResponse.status, 200);
        const updatedConfig = (await updateConfigResponse.json()) as {
          statuses: Array<{ id: number; isPaused: boolean }>;
        };
        assert.equal(
          updatedConfig.statuses.find((status) => status.id === configurableStatus.id)?.isPaused,
          !configurableStatus.isPaused,
        );
      } finally {
        if (pauseConfigChanged) {
          const restoreConfigResponse = await fetch(
            `http://127.0.0.1:${address.port}/portal-config/statuses`,
            {
              method: "PATCH",
              headers: {
                Cookie: `${Config.COOKIE_NAME}=${adminToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ statuses: config.statuses }),
            },
          );
          assert.equal(restoreConfigResponse.status, 200);
        }
      }

      const settingsAudit = await db("audit_history")
        .where({ entity_type: "settings", action_type: "settings.update" })
        .orderBy("audit_id", "desc")
        .first<{ audit_id: number }>("audit_id");
      assert.ok(settingsAudit);
      const detailResponse = await fetch(
        `http://127.0.0.1:${address.port}/audit-history/${settingsAudit.audit_id}`,
        { headers: { Cookie: `${Config.COOKIE_NAME}=${adminToken}` } },
      );
      assert.equal(detailResponse.status, 200);
      const auditDetail = (await detailResponse.json()) as {
        entity_type: string;
        action_type: string;
        actor: { kind: string };
      };
      assert.equal(auditDetail.entity_type, "settings");
      assert.equal(auditDetail.action_type, "settings.update");
      assert.equal(auditDetail.actor.kind, "user");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }

    const protocol = "MAAT-8K3P-9X2M";
    const request = await db("requests as r")
      .join("details_professional as p", "p.professional_id", "r.professional_id")
      .where("r.protocol", protocol)
      .first<{
        request_id: number;
        status_id: number;
        assignee_user_id: number;
        requester_id: string;
      }>("r.request_id", "r.status_id", "p.user_id as assignee_user_id", "r.requester_id");
    assert.ok(request);

    const analyst = await db("users as u")
      .join("profiles as p", "p.profile_id", "u.profile_id")
      .where("u.user_id", request.assignee_user_id)
      .first<{
        user_id: number;
        email: string;
        full_name: string;
        password_changed_at: Date;
        profile_name: string;
      }>("u.user_id", "u.email", "u.full_name", "u.password_changed_at", "p.name as profile_name");
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

    const manager = await db("users as u")
      .join("profiles as p", "p.profile_id", "u.profile_id")
      .whereRaw("lower(p.name) = ?", ["gestor"])
      .first<{
        user_id: number;
        email: string;
        full_name: string;
        password_changed_at: Date;
      }>("u.user_id", "u.email", "u.full_name", "u.password_changed_at");
    assert.ok(manager, "o seed deve disponibilizar um usuário Gestor");

    const requester = await db("requesters")
      .where({ requester_id: request.requester_id })
      .first<{ full_name: string; corporate_email: string }>("full_name", "corporate_email");
    assert.ok(requester, "o seed deve disponibilizar a identidade do solicitante");

    const analystToken = createToken(analyst, "Analista");
    const managerToken = createToken(manager, "Gestor");
    const routeServer = app.listen(0, "127.0.0.1");
    let routeBaseUrl = "";
    let analystTransitionCommitted = false;
    try {
      await new Promise<void>((resolve, reject) => {
        routeServer.once("listening", resolve);
        routeServer.once("error", reject);
      });
      const address = routeServer.address();
      assert.ok(address && typeof address !== "string");
      routeBaseUrl = `http://127.0.0.1:${address.port}`;

      const statusChange = await fetch(`${routeBaseUrl}/requests/${protocol}/status`, {
        method: "PATCH",
        headers: {
          Cookie: `${Config.COOKIE_NAME}=${analystToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetStatus: target.status_id,
          justification: "Validação de integração da auditoria.",
          lastTechnicalMessage: "Validação de integração.",
        }),
      });
      analystTransitionCommitted = statusChange.status === 200;
      assert.equal(statusChange.status, 200);
      const statusChangeBody = (await statusChange.json()) as {
        protocol: string;
        previous: string;
        next: string;
        lastUpdate: string;
      };
      assert.equal(statusChangeBody.protocol, protocol);
      assert.equal(statusChangeBody.previous, "Aguardando mapeamento");
      assert.equal(statusChangeBody.next, target.name);
      assert.ok(Number.isFinite(Date.parse(statusChangeBody.lastUpdate)));

      const humanEvent = await db("audit_history")
        .where({
          entity_type: "request",
          entity_id: protocol,
          action_type: "request.status_change",
          user_id: analyst.user_id,
          status_id: target.status_id,
        })
        .first("audit_id");
      assert.ok(humanEvent, "a transição humana deve gerar um evento auditado com snapshot");
      const restoreResponse = await fetch(`${routeBaseUrl}/requests/${protocol}/status`, {
        method: "PATCH",
        headers: {
          Cookie: `${Config.COOKIE_NAME}=${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetStatus: request.status_id,
          justification: "Restaurar estado do seed.",
          lastTechnicalMessage: "Validação de integração.",
        }),
      });
      analystTransitionCommitted = restoreResponse.status !== 200;
      assert.equal(restoreResponse.status, 200);
      analystTransitionCommitted = false;

      const deniedResponse = await fetch(`${routeBaseUrl}/requests/${protocol}/status`, {
        method: "PATCH",
        headers: {
          Cookie: `${Config.COOKIE_NAME}=${managerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetStatus: request.status_id,
          justification: "Validar tentativa negada.",
        }),
      });
      assert.equal(deniedResponse.status, 403);
      const deniedBody = (await deniedResponse.json()) as {
        status: string;
        statusCode: number;
        code: string;
      };
      assert.equal(deniedBody.status, "error");
      assert.equal(deniedBody.statusCode, 403);
      assert.equal(deniedBody.code, "INSUFFICIENT_ROLE_PERMISSIONS");

      const deniedEvent = await db("audit_history")
        .where({
          entity_type: "request",
          entity_id: protocol,
          action_type: "request.access_denied",
          user_id: manager.user_id,
        })
        .orderBy("audit_id", "desc")
        .first("audit_id");
      assert.ok(deniedEvent, "a tentativa negada deve gerar request.access_denied");

      const pendingResponse = await fetch(
        `${routeBaseUrl}/requests/${protocol}/pending-items/00000000-0000-4000-8000-000000000099`,
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
      assert.equal(pendingResponse.status, 200);
      const pendingBody = (await pendingResponse.json()) as { status: string };
      assert.equal(pendingBody.status, "responded");

      const automaticTarget = await db("statuses")
        .where({ name: "Em triagem" })
        .first<{ status_id: number; name: string }>("status_id", "name");
      assert.ok(automaticTarget, "o Status de triagem deve existir no seed");

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
    } finally {
      try {
        if (analystTransitionCommitted) {
          const restoreResponse = await fetch(`${routeBaseUrl}/requests/${protocol}/status`, {
            method: "PATCH",
            headers: {
              Cookie: `${Config.COOKIE_NAME}=${adminToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              targetStatus: request.status_id,
              justification: "Restaurar estado do seed após falha do teste.",
              lastTechnicalMessage: "Validação de integração.",
            }),
          });
          assert.equal(restoreResponse.status, 200);
        }
      } finally {
        await new Promise<void>((resolve, reject) => {
          routeServer.close((error) => (error ? reject(error) : resolve()));
        });
      }
    }
  },
);

test("fecha o pool do banco após os testes de integração", async () => {
  await db.destroy();
});
