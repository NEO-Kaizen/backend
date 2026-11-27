import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import db from "../src/database/conection.ts";
import { emitNotification } from "../src/shared/notifications/emitNotification.ts";

/**
 * Verifica a atomicidade da seam de Notificação: a linha é gravada dentro da
 * transação e desaparece quando a transação sofre rollback. Requer o banco
 * migrado e com as seeds-base.
 */

const marker = `verify.rollback:${randomUUID()}`;

try {
  const request = await db("requests")
    .select("request_id", "protocol", "title")
    .orderBy("request_id", "asc")
    .first();
  assert.ok(request, "Nenhuma solicitação encontrada; rode as seeds-base");

  const users = await db("users")
    .where({ is_active: true })
    .orderBy("user_id", "asc")
    .limit(2)
    .select("user_id");
  assert.equal(users.length, 2, "A verificação exige ao menos dois usuários ativos");

  const actorUserId = Number(users[0].user_id);
  const recipientUserId = Number(users[1].user_id);
  const dedupKey = `${marker}:${recipientUserId}`;

  const event = {
    type: "status_changed",
    eventKey: marker,
    requestId: String(request.request_id),
    actorUserId,
    recipientUserIds: [recipientUserId],
    payload: {
      type: "status_changed",
      protocol: request.protocol,
      title: request.title,
      newStatus: "Em triagem",
    },
  };

  let writtenInside = 0;
  await db
    .transaction(async (trx) => {
      const committed = await emitNotification(trx, event);
      writtenInside = committed.length;

      const row = await trx("notifications")
        .where({ dedup_key: dedupKey })
        .first("notification_id");
      assert.ok(row, "A Notificação não foi gravada dentro da transação");

      throw new Error("rollback-forçado-pela-verificação");
    })
    .catch((error) => {
      if (error.message !== "rollback-forçado-pela-verificação") throw error;
    });

  assert.equal(writtenInside, 1, "A emissão deve gravar uma Notificação na transação");

  const orphan = await db("notifications")
    .where("dedup_key", "like", `${marker}:%`)
    .first("notification_id");
  assert.equal(orphan, undefined, "Rollback deixou uma Notificação órfã");

  console.log("rollback OK: 1 gravada na transação, 0 órfãs após rollback");
} finally {
  await db.destroy();
}
