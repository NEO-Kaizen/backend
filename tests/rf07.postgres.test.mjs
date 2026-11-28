// Execute com NODE_ENV=test e conexão explícita de um cluster de testes.
// O harness provisiona um banco separado para migrations e fixtures.
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import { Client } from "pg";

const root = join(import.meta.dirname, "..");
const sandbox = mkdtempSync(join(tmpdir(), "maat-rf07-"));
const database = `maat_rf07_${randomUUID().replaceAll("-", "")}`;
const connection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 5000,
};
let db;
let server;
let origin;
let cookies;
let nextId = 10000;
const playwrightModule = process.env.RF07_PLAYWRIGHT_MODULE;
const frontendOrigin = "http://127.0.0.1:4177";
const cancellation = { justification: "  Motivo exclusivo da auditoria.  " };
const triage = {
  adherentToScope: "Não",
  adherentJustification: "Fora do escopo do exemplo.",
  changeCategory: "Não",
  exitStatus: 5,
  result: "Avaliada",
  conclusionJustification: "Justificativa da avaliação.",
  lastTechnicalMessage: "Avaliação registrada.",
};
const actorIds = { requester: 112, other: 104, admin: 102 };

before(async () => {
  assert.equal(process.env.NODE_ENV, "test");
  assert.match(connection.database ?? "", /^(test|[a-z0-9_]+_test)$/i);
  assert.ok(connection.host, "Informe DB_HOST para o cluster de testes.");
  const provisioner = new Client(connection);
  try {
    await provisioner.connect();
    await provisioner.query('CREATE DATABASE "' + database + '"');
  } finally {
    await provisioner.end();
  }
  console.log(`Banco isolado: ${database}`);

  process.chdir(sandbox);
  process.env.DB_NAME = database;
  process.env.JWT_SECRET = randomUUID();
  process.env.SWAGGER_ENABLED = "false";
  if (playwrightModule) process.env.CORS_ORIGINS = frontendOrigin;
  ({ default: db } = await import("../src/database/conection.ts"));
  assert.equal((await db.raw("select current_database() as name")).rows[0].name, database);
  await db.migrate.latest({
    directory: ["migrations", "migrations/requester_request", "migrations/users"].map((dir) =>
      join(root, dir),
    ),
    extension: "js",
  });
  await db.seed.run({ directory: join(root, "seeds/requester_request"), extension: "js" });

  const { generateToken } = await import("../src/shared/utils/jwtUtil.ts");
  const { default: config } = await import("../src/configs.ts");
  cookies = {};
  for (const [key, id] of Object.entries(actorIds)) {
    const user = await db("users").where({ user_id: id }).first();
    const token = generateToken({
      id: String(id),
      name: user.full_name,
      email: user.email,
      password_changed_at: user.password_changed_at.getTime(),
    });
    cookies[key] = `${config.COOKIE_NAME}=${token}`;
  }

  const { app } = await import("../src/app.ts");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  await db?.destroy();
});

async function fixture(status = 1, owner = actorIds.requester) {
  const original = await db("requests").where({ request_id: 1 }).first();
  const request = {
    ...original,
    request_id: ++nextId,
    protocol: `RF07-TEST-${nextId}`,
    status_id: status,
    last_public_status_id: status,
    requester_user_id: owner,
  };
  await db("requests").insert(request);
  return request;
}

async function call(request, route, { method = "POST", actor = "requester", body, headers } = {}) {
  const response = await fetch(`${origin}/requests/${request.protocol}/${route}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(actor ? { cookie: cookies[actor] } : {}),
      ...headers,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  return { status: response.status, body: await response.json() };
}

const cancel = (request, options = {}) =>
  call(request, "cancel", { body: cancellation, ...options });
const assess = (request) => call(request, "triage", { actor: "admin", body: triage });
const audit = (request, action) =>
  db("audit_history").where({ entity_id: request.protocol, action_type: action });
const assessments = (request) => db("triages").where({ request_id: request.request_id });
const current = (request) => db("requests").where({ request_id: request.request_id }).first();

test("sessão, perfil, titularidade direta, legado e validação HTTP", async () => {
  const request = await fixture();
  const legacy = await fixture(1, null);
  assert.equal((await cancel(request, { actor: null })).status, 401);
  assert.equal(
    (
      await cancel(request, {
        actor: null,
        headers: { "X-Requester-Identity": '{"name":"Exemplo","email":"exemplo@example.invalid"}' },
      })
    ).status,
    401,
  );
  assert.equal((await cancel(request, { actor: "admin" })).status, 404);
  const missing = await cancel({ protocol: "RF07-INEXISTENTE" });
  assert.equal(missing.status, 404);
  assert.deepEqual(await cancel(request, { actor: "other" }), missing);
  assert.deepEqual(await cancel(legacy), missing);
  for (const body of [
    {},
    { justification: "" },
    { justification: "  " },
    { justification: 7 },
    { justification: "x".repeat(4001) },
  ]) {
    assert.equal((await cancel(request, { body })).status, 422);
  }
  assert.equal((await current(request)).status_id, 1);
  assert.equal((await audit(request, "request.status_change")).length, 0);
});

test("tracking, cancelamento, projeção pública, anexos, auditoria e repetição", async () => {
  const request = await fixture();
  const attachment = await db("attachments").where({ request_id: 1 }).first();
  await db("attachments").insert({
    ...attachment,
    attachment_id: randomUUID(),
    request_id: request.request_id,
  });
  const previous = await current(request);
  const previousAttachments = await db("attachments").where({ request_id: request.request_id });
  assert.equal(previous.closure_ref, null);
  assert.equal((await call(request, "tracking", { method: "GET" })).body.details.canCancel, true);
  assert.deepEqual(await cancel(request), { status: 200, body: { status: "Cancelado" } });
  const updated = await current(request);
  assert.equal(updated.status_id, 17);
  assert.equal(updated.last_public_status_id, 17);
  assert.match(updated.closure_ref, /^[\da-f-]{36}$/i);
  assert.equal(updated.last_technical_message, "Solicitação cancelada pelo titular.");
  assert.ok(updated.last_external_update_at instanceof Date);
  for (const column of Object.keys(previous)) {
    if (
      ![
        "status_id",
        "closure_ref",
        "last_public_status_id",
        "last_technical_message",
        "last_external_update_at",
        "updated_at",
        "updated_by",
      ].includes(column)
    ) {
      assert.deepEqual(updated[column], previous[column], column);
    }
  }
  assert.deepEqual(
    await db("attachments").where({ request_id: request.request_id }),
    previousAttachments,
  );
  const tracking = (await call(request, "tracking", { method: "GET" })).body.details;
  assert.equal(tracking.canCancel, false);
  assert.equal(tracking.status, "Cancelado");
  assert.ok(!JSON.stringify(tracking).includes(cancellation.justification.trim()));
  assert.equal((await cancel(request)).body.code, "rf07_not_eligible");
  const [event, duplicate] = await audit(request, "request.status_change");
  assert.equal(duplicate, undefined);
  assert.equal(event.user_id, actorIds.requester);
  assert.equal(event.change_origin, "requester");
  assert.equal(event.previous_value, "Solicitação enviada");
  assert.equal(event.new_value, "Cancelado");
  assert.equal(event.note, cancellation.justification.trim());
});

test("confirmações de cancelamento não atravessam reaberturas sucessivas", async () => {
  const request = await fixture();
  const tracking = async () => {
    const response = await call(request, "tracking", { method: "GET" });
    assert.equal(response.status, 200);
    return response.body.details;
  };
  const initial = (await tracking()).cancelCycleRef;
  assert.equal(initial, "initial");

  let cycleRef = initial;
  for (const cycle of [1, 2]) {
    const justification = `Cancelar ciclo ${cycle}`;
    const canceled = await cancel(request, { body: { justification, cancelCycleRef: cycleRef } });
    assert.equal(canceled.status, 200);
    const closed = await tracking();
    assert.equal(closed.canCancel, false);
    assert.equal(Object.hasOwn(closed, "cancelCycleRef"), false);
    assert.equal(closed.canReopen, true);

    const reopened = await call(request, "reopen", {
      body: { justification: `Reabrir ciclo ${cycle}`, closureRef: closed.closureRef },
    });
    assert.equal(reopened.status, 200);
    const active = await tracking();
    assert.equal(active.canCancel, true);
    assert.equal(active.canReopen, false);
    assert.equal(typeof active.cancelCycleRef, "string");
    assert.notEqual(active.cancelCycleRef, initial);
    assert.notEqual(active.cancelCycleRef, cycleRef);

    for (const staleRef of [undefined, initial, cycleRef]) {
      const stale = await cancel(request, {
        body: { justification: "Confirmação obsoleta", cancelCycleRef: staleRef },
      });
      assert.equal(stale.status, 409);
      assert.equal(stale.body.code, "rf07_cycle_conflict");
    }
    assert.equal((await current(request)).status_id, 1);
    assert.equal((await audit(request, "request.status_change")).length, cycle);
    assert.equal((await audit(request, "request.reopen")).length, cycle);
    cycleRef = active.cancelCycleRef;
  }

  await db("requests").where({ request_id: request.request_id }).update({ title: "Edição comum" });
  assert.equal((await tracking()).cancelCycleRef, cycleRef);
  const legitimate = await cancel(request, {
    body: { justification: "Confirmação vigente", cancelCycleRef: cycleRef },
  });
  assert.equal(legitimate.status, 200);
  assert.equal((await current(request)).status_id, 17);
  assert.equal((await audit(request, "request.status_change")).length, 3);
});

test("identidade do ciclo não depende do marco temporal da reabertura", async () => {
  const request = await fixture();
  const tracking = async () => {
    const response = await call(request, "tracking", { method: "GET" });
    assert.equal(response.status, 200);
    return response.body.details;
  };
  assert.equal((await tracking()).cancelCycleRef, "initial");

  const identity = [];
  const marks = [];
  let cycleRef = "initial";
  for (const cycle of [1, 2]) {
    const canceled = await cancel(request, {
      body: { justification: `Cancelar ciclo ${cycle}`, cancelCycleRef: cycleRef },
    });
    assert.equal(canceled.status, 200);
    const closed = await tracking();
    const reopened = await call(request, "reopen", {
      body: { justification: `Reabrir ciclo ${cycle}`, closureRef: closed.closureRef },
    });
    assert.equal(reopened.status, 200);
    const active = await tracking();
    assert.match(
      active.cancelCycleRef,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    identity.push(active.cancelCycleRef);
    marks.push((await current(request)).last_reopened_at);
    cycleRef = active.cancelCycleRef;
  }
  assert.notEqual(identity[0], identity[1]);

  // Força o mesmo marco temporal nos dois ciclos: a identidade permanece.
  await db("requests")
    .where({ request_id: request.request_id })
    .update({ last_reopened_at: marks[0] });
  const forced = await tracking();
  assert.equal(forced.cancelCycleRef, identity[1]);
  assert.notEqual(forced.cancelCycleRef, identity[0]);

  // Edição comum preserva a identidade.
  await db("requests").where({ request_id: request.request_id }).update({ title: "Edição comum" });
  assert.equal((await tracking()).cancelCycleRef, identity[1]);

  // Confirmação antiga não atravessa a reabertura.
  const stale = await cancel(request, {
    body: { justification: "Confirmação obsoleta", cancelCycleRef: identity[0] },
  });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.code, "rf07_cycle_conflict");
  assert.equal((await current(request)).status_id, 1);

  // Confirmação vigente continua funcionando.
  const legitimate = await cancel(request, {
    body: { justification: "Confirmação vigente", cancelCycleRef: identity[1] },
  });
  assert.equal(legitimate.status, 200);
  assert.equal((await current(request)).status_id, 17);
});

test("status 2, 3, 16, 17 e status 1 com triagem registrada", async () => {
  for (const status of [2, 3, 16, 17]) {
    const request = await fixture(status);
    const response = await cancel(request);
    assert.equal(response.status, 422);
    assert.equal(response.body.code, "rf07_not_eligible");
  }
  const request = await fixture();
  assert.equal((await assess(request)).status, 201);
  assert.equal((await updateStatus(request, 1)).status, 200);
  assert.equal((await call(request, "tracking", { method: "GET" })).body.details.canCancel, false);
  assert.equal((await cancel(request)).body.code, "rf07_not_eligible");
  assert.equal((await assessments(request)).length, 1);
});

async function updateStatus(request, targetStatus) {
  return call(request, "status", {
    method: "PATCH",
    actor: "admin",
    body: {
      targetStatus,
      justification: "Ajuste administrativo de teste.",
      lastTechnicalMessage: "Estado atualizado.",
    },
  });
}

test("falha de auditoria reverte status e projeção", async () => {
  const request = await fixture();
  const previous = await current(request);
  // Restrição exclusiva do banco descartável e limitada a este protocolo.
  await db.raw(
    "alter table audit_history add constraint rf07_reject_fixture check (entity_id <> " +
      "'RF07-TEST-" +
      Number(request.request_id) +
      "')",
  );
  assert.equal((await cancel(request)).status, 500);
  assert.deepEqual(await current(request), previous);
  assert.equal((await audit(request, "request.status_change")).length, 0);
});

async function waitForBlocked(queryFragment) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const { rows } = await db.raw(
      "select pid, pg_blocking_pids(pid) as blockers from pg_stat_activity " +
        "where datname = current_database() and pid <> pg_backend_pid() and cardinality(pg_blocking_pids(pid)) > 0 and query ilike ?",
      [`%${queryFragment}%`],
    );
    if (rows.length > 0) return rows[0];
    await delay(20);
  }
  throw new Error(`Espera por lock não observada: ${queryFragment}`);
}

async function overlap(action, startWinner, startLoser, losingQuery) {
  // Pausa depois da escrita na solicitação, imediatamente antes da auditoria.
  await db.raw(`
    create or replace function rf07_audit_barrier() returns trigger language plpgsql as $$
    begin
      if new.action_type = TG_ARGV[0] then perform pg_advisory_xact_lock(70107); end if;
      return new;
    end $$;
    create or replace trigger rf07_pause_winner before insert on audit_history
    for each row execute function rf07_audit_barrier('${action}');
  `);
  const gate = await db.transaction();
  let winner;
  let loser;
  try {
    await gate.raw("select pg_advisory_xact_lock(70107)");
    winner = startWinner();
    const paused = await waitForBlocked('insert into "audit_history"');
    loser = startLoser();
    const waiting = await waitForBlocked(losingQuery);
    assert.ok(waiting.blockers.includes(paused.pid), "operações reais sobrepostas");
  } finally {
    await gate.commit();
    await Promise.allSettled([winner, loser]);
    await db.raw("drop trigger rf07_pause_winner on audit_history");
  }
  return Promise.all([winner, loser]);
}

test("cancelamento vence triagem real: CAS 409 e rollback da avaliação", async () => {
  const request = await fixture();
  const [canceled, assessed] = await overlap(
    "request.status_change",
    () => cancel(request),
    () => assess(request),
    "for no key update",
  );
  assert.equal(canceled.status, 200);
  assert.equal(assessed.status, 409);
  assert.equal((await current(request)).status_id, 17);
  assert.equal((await assessments(request)).length, 0);
  assert.equal((await audit(request, "request.triage")).length, 0);
  assert.equal((await audit(request, "request.status_change")).length, 1);
});

test("triagem real vence: cancelamento relê estado e recebe 422", async () => {
  const request = await fixture();
  const [assessed, canceled] = await overlap(
    "request.triage",
    () => assess(request),
    () => cancel(request),
    "for no key update",
  );
  assert.equal(assessed.status, 201);
  assert.equal(canceled.status, 422);
  assert.equal((await current(request)).status_id, 5);
  assert.equal((await assessments(request)).length, 1);
  assert.equal((await audit(request, "request.triage")).length, 1);
  assert.equal((await audit(request, "request.status_change")).length, 0);
});

test("override concorrente devolve ao status 1, mas triagem persistida impede cancelamento", async () => {
  const request = await fixture();
  assert.equal((await assess(request)).status, 201);
  const [changed, canceled] = await overlap(
    "request.status_override",
    () => updateStatus(request, 1),
    () => cancel(request),
    "for no key update",
  );
  assert.equal(changed.status, 200);
  assert.equal(canceled.body.code, "rf07_not_eligible");
  assert.equal((await current(request)).status_id, 1);
  assert.equal((await assessments(request)).length, 1);
  assert.equal((await audit(request, "request.status_change")).length, 0);
});

test("dois cancelamentos sobrepostos geram uma única auditoria", async () => {
  const request = await fixture();
  const [first, second] = await overlap(
    "request.status_change",
    () => cancel(request),
    () => cancel(request),
    "for no key update",
  );
  assert.equal(first.status, 200);
  assert.equal(second.status, 422);
  assert.equal(second.body.code, "rf07_not_eligible");
  assert.equal((await current(request)).status_id, 17);
  assert.equal((await audit(request, "request.status_change")).length, 1);
});

test("override torna solicitação elegível inelegível antes da releitura", async () => {
  const request = await fixture();
  assert.equal((await call(request, "tracking", { method: "GET" })).body.details.canCancel, true);
  const [changed, canceled] = await overlap(
    "request.status_override",
    () => updateStatus(request, 5),
    () => cancel(request),
    "for no key update",
  );
  assert.equal(changed.status, 200);
  assert.equal(canceled.status, 422);
  assert.equal(canceled.body.code, "rf07_not_eligible");
  assert.equal((await current(request)).status_id, 5);
  assert.equal((await assessments(request)).length, 0);
  assert.equal((await audit(request, "request.status_change")).length, 0);
});

async function pauseAssignmentAfterRead(protocol, assign, whilePaused) {
  const originalRunner = db.client.runner;
  const read = Promise.withResolvers();
  const resume = Promise.withResolvers();

  // Deixa o SELECT real terminar e pausa antes de entregar o resultado ao service.
  db.client.runner = function (builder) {
    const runner = originalRunner.call(this, builder);
    if (builder._method === "first") {
      const { sql, bindings } = builder.toSQL();
      if (bindings.includes(protocol) && sql.includes('"requests"."screening_result"')) {
        const run = runner.run.bind(runner);
        runner.run = async () => {
          const row = await run();
          read.resolve(row);
          await resume.promise;
          return row;
        };
      }
    }
    return runner;
  };

  const assignment = assign();
  try {
    const context = await Promise.race([
      read.promise,
      assignment.then(({ status }) => {
        throw new Error(`A atribuição terminou antes da barreira: HTTP ${status}`);
      }),
      delay(5000, undefined, { ref: false }).then(() => {
        throw new Error("A leitura da atribuição não chegou à barreira");
      }),
    ]);
    assert.equal(context.status, "Em triagem");
    assert.equal(context.screening_result, "elegivel");
    await whilePaused();
  } finally {
    db.client.runner = originalRunner;
    resume.resolve();
    await Promise.allSettled([assignment]);
  }
  return assignment;
}

for (const route of ["assignee", "internal/assignee"]) {
  test(`RN-010 em ${route} não sobrescreve cancelamento após override`, async () => {
    const request = await fixture(3);
    const candidate = await db("details_professional").where({ user_id: 101 }).first();
    await db("requests").where({ request_id: request.request_id }).update({
      professional_id: null,
      screening_result: "elegivel",
    });
    const assign = (target) =>
      call(target, route, {
        method: "PATCH",
        actor: "admin",
        body:
          route === "assignee"
            ? { professionalId: candidate.professional_id }
            : { assigneeId: String(candidate.user_id) },
      });

    let canceled;
    const result = await pauseAssignmentAfterRead(
      request.protocol,
      () => assign(request),
      async () => {
        assert.equal((await updateStatus(request, 1)).status, 200);
        assert.equal((await cancel(request)).status, 200);
        canceled = await current(request);
      },
    );

    assert.equal(result.status, 409);
    assert.equal(canceled.status_id, 17);
    assert.equal(canceled.last_public_status_id, 17);
    assert.deepEqual(await current(request), canceled);
    assert.equal((await audit(request, "request.assign")).length, 0);
    assert.equal((await audit(request, "request.unassign")).length, 0);
    assert.equal((await audit(request, "request.status_change")).length, 1);

    const legitimate = await fixture(3);
    await db("requests").where({ request_id: legitimate.request_id }).update({
      professional_id: null,
      screening_result: "elegivel",
    });
    assert.equal((await assign(legitimate)).status, 200);
    const advanced = await current(legitimate);
    assert.equal(advanced.status_id, 5);
    assert.equal(advanced.last_public_status_id, 3);
    assert.equal(advanced.professional_id, candidate.professional_id);
    assert.equal((await audit(legitimate, "request.status_change")).length, 1);
  });
}

test("OpenAPI descreve os DTOs reais e rejeição de protocolo em branco", async () => {
  const { openapiSpec } = await import("../src/docs/swagger.ts");
  const { components, paths } = openapiSpec;
  const request = await fixture();
  const internal = await call(request, "internal", { method: "GET", actor: "admin" });
  const tracking = await call(request, "tracking", { method: "GET" });
  assert.equal(internal.status, 200);
  assert.equal(tracking.status, 200);
  for (const [schemaName, details] of [
    ["InternalRequestDetail", internal.body],
    ["RequesterRequestDetails", tracking.body.details],
  ]) {
    for (const field of components.schemas[schemaName].required) {
      assert.ok(Object.hasOwn(details, field), `${schemaName}.${field}`);
    }
  }
  assert.ok(!Object.hasOwn(internal.body, "canCancel"));
  assert.ok(components.schemas.RequesterRequestDetails.required.includes("canCancel"));
  assert.ok(components.schemas.RequesterRequestDetails.required.includes("canReopen"));
  assert.equal(components.schemas.RequesterRequestDetails.properties.cancelCycleRef.type, "string");
  assert.equal(components.schemas.CancelRequestPayload.properties.cancelCycleRef.type, "string");
  assert.equal(tracking.body.details.cancelCycleRef, "initial");
  assert.equal(tracking.body.details.canCancel, true);
  const operation = paths["/requests/{protocol}/cancel"].post;
  assert.ok(operation.responses["400"]);
  assert.ok(!new RegExp(operation.parameters[0].schema.pattern).test(" "));
  assert.equal((await cancel({ protocol: "%20" })).status, 400);
});

test(
  "navegador protege a troca de protocolo e limpa detalhes após perda de acesso",
  {
    skip: !playwrightModule && "Informe RF07_PLAYWRIGHT_MODULE para executar com Chromium.",
    timeout: 90000,
  },
  async () => {
    const { verifyTrackingInBrowser } = await import("./rf07.browser.mjs");
    const frontendRoot = join(root, "../frontend");
    const [cookieName, cookieValue] = cookies.requester.split("=");
    const requester = await db("users").where({ user_id: actorIds.requester }).first();
    await verifyTrackingInBrowser({
      playwrightModule,
      frontendRoot,
      frontendOrigin,
      apiOrigin: origin,
      cookie: { name: cookieName, value: cookieValue, url: frontendOrigin },
      createRequest: async (protocol) => {
        const request = await fixture();
        await db("requests").where({ request_id: request.request_id }).update({ protocol });
        return { ...request, protocol };
      },
      current,
      changeProfile: async (actor) => {
        const { profile_id } =
          actor === "requester"
            ? requester
            : await db("users").where({ user_id: actorIds[actor] }).first();
        await db("users").where({ user_id: actorIds.requester }).update({ profile_id });
      },
      changeOwner: (request) =>
        db("requests")
          .where({ request_id: request.request_id })
          .update({ requester_user_id: actorIds.other }),
    });
  },
);
