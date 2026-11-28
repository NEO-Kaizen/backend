/* global document:readonly, getComputedStyle:readonly */
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
    const reopenPosts = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/reopen")) {
        reopenPosts.push(new URL(request.url()).pathname);
      }
      if (request.method() === "POST" && request.url().endsWith("/cancel")) {
        posted.push(new URL(request.url()).pathname);
      }
    });

    // RF07: regressão visual e de teclado sobre os componentes reais.
    const assertColor = async (locator, property, expected) => {
      let colors;
      for (let attempt = 0; attempt < 30; attempt++) {
        colors = await locator.evaluate(
          (element, { property, expected }) => {
            const probe = document.createElement("span");
            element.append(probe);
            probe.style.setProperty(property, expected);
            try {
              return {
                actual: getComputedStyle(element).getPropertyValue(property),
                expected: getComputedStyle(probe).getPropertyValue(property),
              };
            } finally {
              probe.remove();
            }
          },
          { property, expected },
        );
        if (colors.actual === colors.expected) return;
        await delay(50);
      }
      assert.equal(colors.actual, colors.expected, property);
    };

    const assertFocused = async (locator) => {
      for (let attempt = 0; attempt < 30; attempt++) {
        if (await locator.evaluate((element) => document.activeElement === element)) return;
        await delay(50);
      }
      assert.fail("Foco fora do elemento esperado");
    };

    const verifyKeyboard = async (trigger, field, submitButton) => {
      await trigger.focus();
      await trigger.click();
      await dialog.waitFor();
      await assertFocused(dialog);
      const close = dialog.getByRole("button", { name: "Fechar", exact: true });
      const back = dialog.getByRole("button", { name: "Voltar", exact: true });
      assert.equal(await dialog.getAttribute("aria-modal"), "true");
      await page.keyboard.press("Tab");
      await assertFocused(close);
      await page.keyboard.press("Tab");
      await assertFocused(field);
      await page.keyboard.press("Tab");
      await assertFocused(back);
      await page.keyboard.press("Tab");
      await assertFocused(close);
      await field.fill("Verificação de teclado sem envio.");
      await close.focus();
      await page.keyboard.press("Shift+Tab");
      await assertFocused(submitButton);
      await page.keyboard.press("Tab");
      await assertFocused(close);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
      await assertFocused(trigger);
    };

    await open(requestB.protocol);
    const viewport = page.viewportSize();
    assert.ok(viewport);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await action.waitFor();
      assert.equal(await action.locator(".material-symbols-outlined").innerText(), "block");
      await assertColor(
        action,
        "color",
        "color-mix(in srgb, var(--status-red) 65%, var(--text-color-primary))",
      );
      await assertColor(action, "border-radius", "var(--radius-md)");
      await page.mouse.move(0, 0);
      await assertColor(action, "background-color", "transparent");
      if (width === 390) {
        const alignment = await action.evaluate((element) => {
          const group = element.closest(".right-status");
          const header = element.closest(".tracking-header");
          const pill = group.querySelector(".status-pill");
          return {
            alignItems: getComputedStyle(group).alignItems,
            alignSelf: getComputedStyle(group).alignSelf,
            groupRight: group.getBoundingClientRect().right,
            headerRight: header.getBoundingClientRect().right,
            buttonRight: element.getBoundingClientRect().right,
            pillRight: pill.getBoundingClientRect().right,
          };
        });
        console.log("[RF07] Geometria mobile:", JSON.stringify(alignment));

        assert.ok(
          Math.abs(alignment.groupRight - alignment.headerRight) <= 2,
          "Grupo de status desalinhado: " + JSON.stringify(alignment),
        );
        assert.ok(
          Math.abs(alignment.buttonRight - alignment.pillRight) <= 2,
          "Botao de cancelamento desalinhado: " + JSON.stringify(alignment),
        );
      }
      await action.click();
      await dialog.waitFor();
      await reason.fill("Verificação visual sem envio.");
      await assertColor(
        confirm,
        "background-color",
        "color-mix(in srgb, var(--status-red) 65%, var(--rich-black))",
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
    }
    await page.setViewportSize(viewport);
    await verifyKeyboard(action, reason, confirm);
    assert.deepEqual(posted, []);
    console.log("[RF07] Estilo desktop/mobile e teclado confirmados.");

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
    await verifyKeyboard(
      reopenAction,
      dialog.getByLabel("Justificativa da reabertura"),
      dialog.getByRole("button", { name: "Confirmar reabertura", exact: true }),
    );
    assert.deepEqual(reopenPosts, []);
    console.log("[RF02] Teclado e retorno do foco confirmados.");
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
    assert.deepEqual(reopenPosts, ["/requests/" + requestB.protocol + "/reopen"]);

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
