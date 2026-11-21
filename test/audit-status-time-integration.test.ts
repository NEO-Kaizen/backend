import assert from "node:assert/strict";
import test from "node:test";
import db from "../src/database/conection.ts";
import { calculateStatusTime } from "../src/modules/auditHistory/statusTime.ts";

const hasDatabaseConfig =
  Boolean(process.env.DB_HOST) &&
  Boolean(process.env.DB_NAME) &&
  Boolean(process.env.DB_USER) &&
  Boolean(process.env.DB_PASSWORD);

interface StatusRow {
  status_id: number;
  name: string;
  is_terminal: boolean;
}

interface RequestRow {
  request_id: number;
  protocol: string;
  created_at: Date;
  status_id: number;
  status: string;
  is_terminal: boolean;
}

test(
  "calcula intervalos de solicitações reais concluídas e em andamento",
  { skip: !hasDatabaseConfig },
  async () => {
    const rollbackSignal = new Error("rollback integration fixtures");

    try {
      await db.transaction(async (trx) => {
        const [completedTarget, inProgressTarget] = await Promise.all([
          trx("statuses")
            .where({ is_terminal: true, is_active: true })
            .orderBy("status_id")
            .first<StatusRow>("status_id", "name", "is_terminal"),
          trx("statuses")
            .where({ is_terminal: false, is_active: true, is_paused: false })
            .orderBy("status_id")
            .first<StatusRow>("status_id", "name", "is_terminal"),
        ]);
        assert.ok(completedTarget);
        assert.ok(inProgressTarget);

        const [completedRequest, inProgressRequest] = await Promise.all([
          trx("requests as r")
            .join("statuses as s", "s.status_id", "r.status_id")
            .whereNot("r.status_id", completedTarget.status_id)
            .orderBy("r.request_id")
            .first<RequestRow>(
              "r.request_id",
              "r.protocol",
              "r.created_at",
              "r.status_id",
              "s.name as status",
              "s.is_terminal",
            ),
          trx("requests as r")
            .join("statuses as s", "s.status_id", "r.status_id")
            .where({ "s.is_paused": true })
            .andWhereNot("r.status_id", inProgressTarget.status_id)
            .orderBy("r.request_id")
            .first<RequestRow>(
              "r.request_id",
              "r.protocol",
              "r.created_at",
              "r.status_id",
              "s.name as status",
              "s.is_terminal",
            ),
        ]);
        assert.ok(completedRequest);
        assert.ok(inProgressRequest);
        assert.notEqual(completedRequest.request_id, inProgressRequest.request_id);
        assert.equal(completedRequest.is_terminal, false);
        assert.equal(inProgressRequest.is_terminal, false);

        const now = new Date();
        const completedTransitionAt = new Date(now.getTime() - 60_000);
        const inProgressTransitionAt = new Date(now.getTime() - 120_000);
        const transitions = [
          {
            request: completedRequest,
            target: completedTarget,
            occurredAt: completedTransitionAt,
          },
          {
            request: inProgressRequest,
            target: inProgressTarget,
            occurredAt: inProgressTransitionAt,
          },
        ];

        for (const transition of transitions) {
          await trx("requests")
            .where({ request_id: transition.request.request_id })
            .update({ status_id: transition.target.status_id });
          await trx("audit_history").insert({
            entity_type: "request",
            entity_id: transition.request.protocol,
            action_type: "request.status_change",
            previous_value: transition.request.status,
            new_value: transition.target.name,
            previous_status_id: transition.request.status_id,
            status_id: transition.target.status_id,
            transaction_id: trx.raw("pg_current_xact_id()"),
            occurred_at: transition.occurredAt,
            change_origin: "system",
          });
        }

        await trx.raw("SET CONSTRAINTS trg_requests_require_status_audit IMMEDIATE");

        const pausedStatusIds = await trx("statuses")
          .where({ is_paused: true })
          .pluck("status_id")
          .then((ids) => ids.map((id: number | string) => Number(id)));

        for (const transition of transitions) {
          const currentInterval = calculateStatusTime({
            openedAt: transition.request.created_at,
            initialStatus: transition.request.status,
            initialStatusId: transition.request.status_id,
            currentStatus: transition.target.name,
            currentStatusId: transition.target.status_id,
            pausedStatusIds,
            transitions: [
              {
                status: transition.target.name,
                statusId: transition.target.status_id,
                occurredAt: transition.occurredAt,
              },
            ],
            now,
          }).intervals.at(-1);

          assert.ok(currentInterval);
          assert.equal(currentInterval.status, transition.target.name);
          assert.equal(currentInterval.exitedAt, null);
          assert.equal(transition.target.is_terminal, transition === transitions[0]);
        }

        throw rollbackSignal;
      });
    } catch (error) {
      if (error !== rollbackSignal) throw error;
    }
  },
);

test("fecha o pool do banco após os testes de integração", async () => {
  await db.destroy();
});
