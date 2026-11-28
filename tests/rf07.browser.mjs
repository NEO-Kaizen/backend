import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export async function verifyTrackingInBrowser({
  playwrightModule,
  frontendRoot,
  frontendOrigin,
  apiOrigin,
  cookie,
  createRequest,
  current,
  changeProfile,
  changeOwner,
}) {
  const { chromium } = await import(playwrightModule);
  const vite = spawn(process.execPath, [join(frontendRoot, "build/index.js")], {
    cwd: frontendRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: new URL(frontendOrigin).port,
      ORIGIN: frontendOrigin,
      PUBLIC_API_URL: apiOrigin,
      API_INTERNAL_URL: apiOrigin,
    },
    stdio: ["ignore", "inherit", "inherit"],
  });
  const exited = once(vite, "exit");
  const requestA = await createRequest("MAAT-RF07-0001");
  const requestB = await createRequest("MAAT-RF07-0002");
  let browser;
  try {
    const deadline = Date.now() + 20000;
    while (true) {
      assert.equal(vite.exitCode, null, "Frontend encerrou antes de iniciar");
      const ready = await fetch(frontendOrigin + "/acompanhar", {
        signal: AbortSignal.timeout(1500),
      }).catch(() => null);
      if (ready?.ok) break;
      assert.ok(Date.now() < deadline, "Frontend não ficou disponível");
      await delay(150);
    }

    browser = await chromium.launch({
      executablePath: process.env.RF07_CHROMIUM_PATH,
      headless: true,
    });
    const context = await browser.newContext();
    context.setDefaultTimeout(12000);
    await context.addCookies([cookie]);
    const page = await context.newPage();

    const action = page.getByRole("button", { name: "Cancelar solicitação", exact: true });
    const dialog = page.getByRole("dialog");
    const confirm = dialog.getByRole("button", { name: "Confirmar cancelamento" });
    const reason = page.getByLabel("Justificativa do cancelamento");
    const path = (protocol) => "/acompanhar/" + protocol;
    const open = async (protocol) => {
      await page.goto(frontendOrigin + path(protocol));

      await action.waitFor();
      await page.locator(".protocol-code").getByText(protocol, { exact: true }).waitFor();
    };
    const search = async (protocol) => {
      const input = page.locator('input[name="pesquisar-chamados"]');
      await input.fill(protocol);
      await input.press("Enter");
      await page.waitForURL("**" + path(protocol));
    };
    const posted = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/cancel")) {
        posted.push(new URL(request.url()).pathname);
      }
    });

    // Cria histórico de navegação SPA e deixa a confirmação de A aberta ao voltar para B.
    await open(requestB.protocol);
    await search(requestA.protocol);
    await action.click();
    await dialog.getByText("Protocolo " + requestA.protocol).waitFor();
    await reason.fill("Motivo exclusivo de A");

    const blocked = Promise.withResolvers();
    const release = Promise.withResolvers();
    const delayed = Promise.withResolvers();
    await page.route(
      "**/requests/" + requestB.protocol + "/tracking",
      async (route) => {
        try {
          const response = await route.fetch();
          blocked.resolve();
          await release.promise;
          await route.fulfill({ response });
        } finally {
          delayed.resolve();
        }
      },
      { times: 1 },
    );

    try {
      await page.goBack();
      await page.waitForURL("**" + path(requestB.protocol));
      await Promise.race([
        blocked.promise,
        delay(5000).then(() => assert.fail("GET de B ausente")),
      ]);
      await dialog.waitFor({ state: "detached" });
      await action.waitFor({ state: "hidden" });
      await page.locator(".protocol-code").waitFor({ state: "hidden" });
      assert.deepEqual(posted, []);

      // Uma resposta de B iniciada na rota anterior chega de propósito depois de voltar a A.
      await search(requestA.protocol);
      await action.waitFor();
      const lateResponse = page.waitForResponse((response) =>
        response.url().endsWith("/" + requestB.protocol + "/tracking"),
      );
      release.resolve();
      assert.equal((await lateResponse).status(), 200);
      await delayed.promise;
      await page.locator(".protocol-code").getByText(requestA.protocol, { exact: true }).waitFor();
      assert.deepEqual(posted, []);
    } finally {
      release.resolve();
    }

    await search(requestB.protocol);
    await action.click();
    await dialog.getByText("Protocolo " + requestB.protocol).waitFor();
    assert.equal(await reason.inputValue(), "");
    await reason.fill("Motivo novo para B");
    const completed = page.waitForResponse((response) =>
      response.url().endsWith("/" + requestB.protocol + "/cancel"),
    );
    await confirm.click();
    assert.equal((await completed).status(), 200);
    await page.locator(".status-pill").getByText("Cancelado", { exact: true }).waitFor();
    assert.deepEqual(posted, ["/requests/" + requestB.protocol + "/cancel"]);
    assert.equal((await current(requestA)).status_id, 1);
    assert.equal((await current(requestB)).status_id, 17);

    // RF02: reabertura real de uma solicitacao cancelada.
    console.log("[RF02] Inicio da validacao no navegador.");

    const reopenAction = page.getByRole("button", {
      name: "Reabrir solicitação",
      exact: true,
    });

    await reopenAction.waitFor();
    await reopenAction.click();

    await dialog.getByText("Protocolo " + requestB.protocol).waitFor();

    const reopenReason = dialog.getByLabel("Justificativa da reabertura");

    const reopenConfirm = dialog.getByRole("button", {
      name: "Confirmar reabertura",
      exact: true,
    });

    assert.equal(await reopenReason.inputValue(), "");
    assert.equal(await reopenConfirm.isDisabled(), true);

    await reopenReason.fill("   ");
    assert.equal(await reopenConfirm.isDisabled(), true);

    await reopenReason.fill("Validacao integrada da RF02.");

    const reopened = page.waitForResponse(
      (response) =>
        response.url().endsWith("/" + requestB.protocol + "/reopen") &&
        response.request().method() === "POST",
    );

    await reopenConfirm.click();

    const reopenResponse = await reopened;

    assert.equal(reopenResponse.status(), 200);

    await dialog.waitFor({ state: "detached" });

    await page.locator(".status-pill").getByText("Solicitação enviada", { exact: true }).waitFor();

    await reopenAction.waitFor({ state: "hidden" });

    assert.equal((await current(requestB)).status_id, 1);

    assert.equal((await current(requestA)).status_id, 1);

    console.log("[RF02] Reabertura confirmada no navegador e PostgreSQL.");

    for (const status of [401, 403, 404]) {
      await context.addCookies([cookie]);
      await open(requestA.protocol);
      await action.click();
      await reason.fill("Operação depois da perda de acesso");
      if (status === 401) await context.clearCookies();
      if (status === 403) await changeProfile("admin");
      if (status === 404) await changeOwner(requestA);
      const rejected = page.waitForResponse((response) =>
        response.url().endsWith("/" + requestA.protocol + "/cancel"),
      );
      await confirm.click();
      const actualStatus = (await rejected).status();

      console.log("[SEGURANCA] HTTP esperado:", status, "recebido:", actualStatus);

      assert.equal(actualStatus, status);
      await dialog.waitFor({ state: "detached" });
      await action.waitFor({ state: "hidden" });
      await page.locator(".protocol-code").waitFor({ state: "hidden" });
      if (status === 403) {
        await page
          .getByText("Seu perfil não tem permissão para acompanhar esta solicitação.", {
            exact: true,
          })
          .waitFor();

        assert.equal(
          await page
            .getByRole("button", {
              name: "Tentar novamente",
            })
            .count(),
          0,
        );
      } else {
        await page
          .getByRole(status === 404 ? "heading" : "button", {
            name: status === 404 ? "Solicitação não encontrada" : "Tentar novamente",
          })
          .waitFor();
      }
      if (status === 403) await changeProfile("requester");
    }
    assert.equal((await current(requestA)).status_id, 1);
  } finally {
    await browser?.close();
    vite.kill("SIGTERM");
    await exited;
  }
}
