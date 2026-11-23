import assert from "node:assert/strict";
import { PENDING_ITEM_EVENT_TYPES } from "../src/shared/notifications/notificationEvents.ts";

/**
 * Verificação por API do ciclo de Pendência (RF20 — issue #158).
 *
 * Requer PostgreSQL descartável migrado e com as seeds-base, além da API
 * local apontada por `API_URL` (padrão `http://127.0.0.1:3000`). O script
 * fecha o lote aberto do seed da request `MAAT-2R7Q-4M1C`, cria um lote novo,
 * responde os itens e revisa de forma mista para conferir as Notificações.
 */

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const PROTOCOL = process.env.VERIFY_PROTOCOL ?? "MAAT-2R7Q-4M1C";
const ADMIN_EMAIL = process.env.VERIFY_ADMIN_EMAIL ?? "administrador_teste@email.com";
const REQUESTER_EMAIL = process.env.VERIFY_REQUESTER_EMAIL ?? "solicitante_teste@email.com";
const PASSWORD = process.env.VERIFY_PASSWORD;
if (!PASSWORD) {
  throw new Error("VERIFY_PASSWORD é obrigatório para a verificação por API.");
}
const REQUESTER_IDENTITY = {
  name: process.env.VERIFY_REQUESTER_NAME ?? "Ana Paula Santos",
  email: process.env.VERIFY_REQUESTER_IDENTITY_EMAIL ?? "ana.santos@empresa.com",
};
const CORRECTED_TITLE = "Analisar inadimplência por região — revisado";
const REQUESTER_IDENTITY_HEADERS = {
  "x-requester-identity": JSON.stringify(REQUESTER_IDENTITY),
};

const ALLOWLIST_KEYS = ["protocol", "title", "type"];

async function request(path, { method = "GET", cookie, body, headers = {} } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  const text = await response.text();
  let parsed = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw new Error(`${method} ${path} respondeu ${response.status}: ${text}`);
  }

  return parsed;
}

function sessionCookie(response) {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);
  const cookie = setCookies.find((value) => value.startsWith("session_id="));
  assert.ok(cookie, "Login não definiu o cookie session_id");
  return cookie.split(";")[0];
}

async function login(email) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`POST /auth/login (${email}) respondeu ${response.status}: ${text}`);
  }

  const user = JSON.parse(text);
  assert.equal(user.mustChangePassword, false, `A conta ${email} exige troca de senha`);

  return { cookie: sessionCookie(response), user };
}

async function listNotifications(cookie) {
  const body = await request("/notifications?limit=50", { cookie });
  assert.ok(Array.isArray(body.items), "GET /notifications não devolveu items");
  return body.items;
}

function notificationCounts(items) {
  const counts = { status_changed: 0 };
  for (const type of PENDING_ITEM_EVENT_TYPES) counts[type] = 0;

  for (const item of items) {
    if (item.payload?.protocol !== PROTOCOL) continue;
    if (Object.hasOwn(counts, item.type)) counts[item.type] += 1;
  }

  return counts;
}

function newNotifications(before, after) {
  const beforeIds = new Set(before.map((item) => item.id));
  return after.filter((item) => item.payload?.protocol === PROTOCOL && !beforeIds.has(item.id));
}

function assertCountsDelta(before, after, expected, label) {
  for (const type of ["status_changed", ...PENDING_ITEM_EVENT_TYPES]) {
    const delta = after[type] - before[type];
    assert.equal(delta, expected[type] ?? 0, `${label}: ${type} variou ${delta}`);
  }
}

function assertAllowlist(items) {
  for (const item of items) {
    assert.deepEqual(
      Object.keys(item.payload).sort(),
      ALLOWLIST_KEYS,
      `${item.type} carregou payload fora da Allowlist: ${JSON.stringify(item.payload)}`,
    );
  }
}

function responseBody(item) {
  if (item.type === "observation") return { response: "Base consolidada reenviada." };
  if (item.field?.fieldKey === "demand.title") return { correctedValue: CORRECTED_TITLE };
  if (item.field?.fieldKey === "operational.peopleInvolved") return { correctedValue: 6 };
  throw new Error(`Item sem resposta prevista: ${JSON.stringify(item)}`);
}

async function readSseNotification(cookie, lastEventId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(
      `${API_URL}/notifications/stream?lastEventId=${encodeURIComponent(lastEventId)}`,
      {
        headers: { cookie, accept: "text/event-stream" },
        signal: controller.signal,
      },
    );
    assert.equal(response.status, 200, `SSE respondeu ${response.status}`);
    assert.ok(response.body, "SSE não devolveu body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
        if (!dataLine) continue;
        return JSON.parse(dataLine.slice("data: ".length));
      }
    }

    throw new Error("SSE terminou sem entregar a Notificação");
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

async function main() {
  console.log(`API: ${API_URL}`);
  console.log(`Protocolo: ${PROTOCOL}`);

  const admin = await login(ADMIN_EMAIL);
  const requester = await login(REQUESTER_EMAIL);

  const requesterBefore = await listNotifications(requester.cookie);
  const adminBefore = await listNotifications(admin.cookie);
  const requesterCountsBefore = notificationCounts(requesterBefore);
  const adminCountsBefore = notificationCounts(adminBefore);

  const pendingBefore = await request(`/requests/${PROTOCOL}/pending-items`, {
    cookie: admin.cookie,
  });
  const seedItem = pendingBefore.items.find((item) => item.status === "requested");
  assert.ok(seedItem, "O seed da request não tem Pendência aberta para fechar");

  await request(`/requests/${PROTOCOL}/pending-items/${seedItem.id}`, {
    method: "PATCH",
    headers: REQUESTER_IDENTITY_HEADERS,
    body: { response: "Base consolidada enviada." },
  });
  await request(`/requests/${PROTOCOL}/pending-items/review`, {
    method: "PATCH",
    cookie: admin.cookie,
    body: {
      batchId: seedItem.batchId,
      items: [{ id: seedItem.id, decision: "validate" }],
    },
  });

  const afterSeedClose = await listNotifications(requester.cookie);
  const countsAfterSeedClose = notificationCounts(afterSeedClose);
  assertCountsDelta(
    requesterCountsBefore,
    countsAfterSeedClose,
    { pending_item_validated: 1 },
    "fechamento do lote do seed",
  );
  console.log("open batch closed OK");

  const created = await request(`/requests/${PROTOCOL}/pending-items`, {
    method: "POST",
    cookie: admin.cookie,
    body: {
      observation: "Verificação automatizada do ciclo de Pendência.",
      requestAttachment: false,
      items: [
        { fieldKey: "demand.title", comment: "Título revisado na verificação." },
        { fieldKey: "operational.peopleInvolved", comment: "Pessoas envolvidas revisadas." },
      ],
    },
  });

  assert.equal(created.items.length, 3, "O lote de verificação deve ter 3 itens");
  assert.ok(
    created.items.every((item) => item.status === "requested"),
    "Os itens do lote novo devem nascer requested",
  );

  const titleItem = created.items.find((item) => item.field?.fieldKey === "demand.title");
  const peopleItem = created.items.find(
    (item) => item.field?.fieldKey === "operational.peopleInvolved",
  );
  const observationItem = created.items.find((item) => item.type === "observation");
  assert.ok(titleItem, "Item de demand.title ausente");
  assert.ok(peopleItem, "Item de operational.peopleInvolved ausente");
  assert.ok(observationItem, "Item de observação ausente");

  const titleBeforeReview = titleItem.field.currentValue;
  assert.equal(typeof titleBeforeReview, "string", "O título atual da request deve ser texto");

  const afterCreate = await listNotifications(requester.cookie);
  const createdNotifications = newNotifications(afterSeedClose, afterCreate);
  assert.equal(createdNotifications.length, 1, "A criação deve gerar uma única Notificação");
  assert.equal(createdNotifications[0].type, "pending_item_created");
  assert.equal(createdNotifications[0].payload.title, titleBeforeReview);
  assertAllowlist(createdNotifications);
  const countsAfterCreate = notificationCounts(afterCreate);
  assertCountsDelta(
    countsAfterSeedClose,
    countsAfterCreate,
    { pending_item_created: 1 },
    "criação do lote",
  );
  console.log("batch created with one notification OK");

  const anchorId = afterSeedClose[0]?.id;
  assert.ok(anchorId, "Sem âncora para o replay do SSE");
  const replayed = await readSseNotification(requester.cookie, anchorId);
  assert.equal(
    replayed.id,
    createdNotifications[0].id,
    "O replay do SSE não entregou a Notificação de criação",
  );
  console.log("created notification delivered by SSE OK");

  for (const item of [titleItem, peopleItem, observationItem]) {
    const updated = await request(`/requests/${PROTOCOL}/pending-items/${item.id}`, {
      method: "PATCH",
      headers: REQUESTER_IDENTITY_HEADERS,
      body: responseBody(item),
    });
    assert.equal(updated.status, "responded", `Item ${item.id} não foi respondido`);
  }

  const afterResponses = await listNotifications(requester.cookie);
  const countsAfterResponses = notificationCounts(afterResponses);
  assertCountsDelta(countsAfterCreate, countsAfterResponses, {}, "respostas");
  console.log("batch responded OK");

  const reviewBody = {
    batchId: created.batchId,
    items: [
      { id: titleItem.id, decision: "validate" },
      { id: peopleItem.id, decision: "validate" },
      { id: observationItem.id, decision: "reopen", comment: "Reenviar a base consolidada." },
    ],
  };

  await request(`/requests/${PROTOCOL}/pending-items/review`, {
    method: "PATCH",
    cookie: admin.cookie,
    body: reviewBody,
  });

  const afterReview = await listNotifications(requester.cookie);
  const reviewNotifications = newNotifications(afterResponses, afterReview);
  assert.equal(reviewNotifications.length, 2, "A revisão mista deve gerar duas Notificações");
  assert.deepEqual(
    reviewNotifications.map((item) => item.type).sort(),
    ["pending_item_reopened", "pending_item_validated"],
    "A revisão mista deve gerar uma Notificação de cada tipo",
  );
  assertAllowlist(reviewNotifications);

  const validatedNotification = reviewNotifications.find(
    (item) => item.type === "pending_item_validated",
  );
  const reopenedNotification = reviewNotifications.find(
    (item) => item.type === "pending_item_reopened",
  );
  assert.equal(validatedNotification.payload.title, CORRECTED_TITLE);
  assert.equal(reopenedNotification.payload.title, CORRECTED_TITLE);

  const countsAfterReview = notificationCounts(afterReview);
  assertCountsDelta(
    countsAfterResponses,
    countsAfterReview,
    { pending_item_validated: 1, pending_item_reopened: 1 },
    "revisão mista",
  );
  console.log("mixed review created one notification per action OK");

  await request(`/requests/${PROTOCOL}/pending-items/review`, {
    method: "PATCH",
    cookie: admin.cookie,
    body: reviewBody,
  });

  const afterRepeat = await listNotifications(requester.cookie);
  assert.equal(
    newNotifications(afterReview, afterRepeat).length,
    0,
    "Reenvio idempotente não pode gerar Notificação",
  );
  assertCountsDelta(countsAfterReview, notificationCounts(afterRepeat), {}, "reenvio idempotente");
  console.log("idempotent review produced no notification OK");

  const adminAfter = await listNotifications(admin.cookie);
  assertCountsDelta(adminCountsBefore, notificationCounts(adminAfter), {}, "ator da ação");
  console.log("actor received nothing and no status_changed event OK");

  const allPendingNotifications = afterRepeat.filter(
    (item) => PENDING_ITEM_EVENT_TYPES.includes(item.type) && item.payload?.protocol === PROTOCOL,
  );
  assertAllowlist(allPendingNotifications);
  console.log("payload allowlist OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
