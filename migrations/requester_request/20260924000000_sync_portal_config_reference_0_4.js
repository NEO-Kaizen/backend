/**
 * Sincroniza dados de referência do portal com `portal-config-api-0_4.md`
 * (Anexo A) e `frontend/src/lib/config/portal-defaults.ts` — sem reescrever
 * migrations antigas.
 *
 * 1. `categories` — descrições conforme Anexo A (nomes/ids já batem);
 * 2. `statuses` 1–17 — matriz de `tone`/`visibility`/`closes_request` do Anexo A
 *    (o backfill antigo deixava tudo `PUBLIC`/`info`, exceto 16/17);
 * 3. `statuses` 18/19 — alinha ids ao contrato de triagem / FE:
 *    `18 Fora do escopo`, `19 Duplicada` (`INTERNAL`/`neutral`/saída de triagem);
 *    linhas legadas 18–22 que conflitam são renomeadas/inativadas (nunca
 *    DELETE — há FK em `requests.status_id`);
 * 4. `system_settings` — `logo_use_primary_color = true` e URLs de asset vazias
 *    preenchidas com os defaults estáticos do Anexo A.
 *
 * Pesos (`criteria.weight`) permanecem seed `10` (`prioritization-api.md`);
 * o Anexo A do contrato é a fonte a corrigir na doc, não aqui.
 */

const CATEGORY_DESCRIPTIONS = {
  1: "Automação de atividades manuais repetitivas",
  2: "Aprimoramento de fluxos e rotinas existentes",
  3: "Criação ou ajuste de indicadores e metas",
  4: "Painéis, relatórios e consultas gerenciais",
  5: "Estudos, cruzamentos e tratamento de dados",
  6: "Padronização de procedimentos, modelos e documentos",
  7: "Revisão e redesenho de processos existentes",
  8: "Suporte técnico especializado às áreas",
  9: "Avaliação de viabilidade técnica, operacional e de custo",
  10: "Demandas que não se enquadram nas demais categorias",
};

/** Anexo A — id → { tone, visibility, closesRequest } (ids 1–17). */
const STATUS_1_17 = {
  1: { tone: "neutral", visibility: "PUBLIC", closes: false },
  2: { tone: "info", visibility: "PUBLIC", closes: false },
  3: { tone: "info", visibility: "PUBLIC", closes: false },
  4: { tone: "warning", visibility: "PUBLIC", closes: false },
  5: { tone: "info", visibility: "PUBLIC", closes: false },
  6: { tone: "info", visibility: "PUBLIC", closes: false },
  7: { tone: "info", visibility: "PUBLIC", closes: false },
  8: { tone: "info", visibility: "INTERNAL", closes: false },
  9: { tone: "success", visibility: "INTERNAL", closes: false },
  10: { tone: "error", visibility: "INTERNAL", closes: false },
  11: { tone: "warning", visibility: "INTERNAL", closes: false },
  12: { tone: "neutral", visibility: "INTERNAL", closes: false },
  13: { tone: "neutral", visibility: "INTERNAL", closes: false },
  14: { tone: "info", visibility: "INTERNAL", closes: false },
  15: { tone: "info", visibility: "INTERNAL", closes: false },
  16: { tone: "success", visibility: "PUBLIC", closes: true },
  17: { tone: "error", visibility: "PUBLIC", closes: true },
};

/** Saídas de triagem conforme contract-triage §4 (7 flags). */
const TRIAGE_EXIT_IDS = [4, 9, 12, 13, 17, 18, 19];

const ASSET_URL_DEFAULTS = [
  ["logo_light_url", "/assets/MAAT-logo.svg"],
  ["logo_dark_url", "/assets/MAAT-logo.svg"],
  ["avatar_light_url", "/assets/avatar-default.svg"],
  ["avatar_dark_url", "/assets/avatar-default.svg"],
  ["login_image_light_url", "/assets/login.png"],
  ["login_image_dark_url", "/assets/loginDark.png"],
  ["favicon_light_url", "/assets/favicon.svg"],
  ["favicon_dark_url", "/assets/favicon.svg"],
];

export async function up(knex) {
  // -------------------------------------------------------------------------
  // 1. Categories — descrições Anexo A (idempotente).
  // -------------------------------------------------------------------------
  for (const [id, description] of Object.entries(CATEGORY_DESCRIPTIONS)) {
    await knex("categories")
      .where({ category_id: Number(id) })
      .update({ description });
  }

  // -------------------------------------------------------------------------
  // 2. Statuses 1–17 — matriz Anexo A (tone/visibility/closes + is_final espelho).
  // -------------------------------------------------------------------------
  for (const [id, s] of Object.entries(STATUS_1_17)) {
    await knex("statuses")
      .where({ status_id: Number(id) })
      .update({
        tone: s.tone,
        visibility: s.visibility,
        closes_request: s.closes,
        is_final: s.closes,
        is_active: true,
      });
  }

  // -------------------------------------------------------------------------
  // 3. Statuses 18/19 — contrato triagem / FE.
  //    Estado legado pós-20260920000000:
  //      18 Elegível para avaliação | 19 Fora do escopo | 20 Direcionada...
  //      21 Duplicada | 22 Cancelada
  //    Alvo: 18 Fora do escopo | 19 Duplicada (ativas, exits);
  //          20–22 inativas (DELETE bloqueado por FK).
  // -------------------------------------------------------------------------
  const hasStatus18 = await knex("statuses").where({ status_id: 18 }).first("status_id");
  const hasStatus19 = await knex("statuses").where({ status_id: 19 }).first("status_id");

  if (hasStatus18 && hasStatus19) {
    // Libera nomes únicos (uk_statuses_name) na ordem segura.
    await knex("statuses")
      .where({ status_id: 21 })
      .whereNotNull("name")
      .update({ name: "Duplicada legado" });
    await knex("statuses")
      .where({ status_id: 22 })
      .whereNotNull("name")
      .update({ name: "Cancelada legado" });
    // 19 pode virar "Duplicada"; 18 pode virar "Fora do escopo".
    await knex("statuses").where({ status_id: 19 }).update({ name: "Duplicada" });
    await knex("statuses").where({ status_id: 18 }).update({ name: "Fora do escopo" });

    // Inativa legados 20–22 (não há no contrato 19-status do FE).
    await knex("statuses")
      .whereIn("status_id", [20, 21, 22])
      .update({ is_active: false, is_triage_exit: false });

    // Upsert do alvo 18/19 (mesmas flags do contrato).
    for (const [id, name] of [
      [18, "Fora do escopo"],
      [19, "Duplicada"],
    ]) {
      const exists = await knex("statuses").where({ status_id: id }).first("status_id");
      const payload = {
        name,
        visibility: "INTERNAL",
        closes_request: false,
        is_final: false,
        is_triage_exit: true,
        tone: "neutral",
        is_active: true,
      };
      if (exists) {
        await knex("statuses").where({ status_id: id }).update(payload);
      } else {
        await knex("statuses").insert({ status_id: id, order_number: id, ...payload });
      }
    }
  } else {
    // Banco novo (sem linhas 18/19) — insere direto.
    for (const [id, name] of [
      [18, "Fora do escopo"],
      [19, "Duplicada"],
    ]) {
      await knex("statuses")
        .insert({
          status_id: id,
          order_number: id,
          name,
          visibility: "INTERNAL",
          closes_request: false,
          is_final: false,
          is_triage_exit: true,
          tone: "neutral",
          is_active: true,
        })
        .onConflict("status_id")
        .ignore();
    }
  }

  // Backfill global: toda saída de triagem ativa (idempotente).
  await knex("statuses")
    .whereIn("status_id", TRIAGE_EXIT_IDS)
    .update({ is_triage_exit: true, is_active: true });

  // Ajusta sequence após inserts.
  await knex.raw(
    "SELECT setval('statuses_status_id_seq', GREATEST((SELECT MAX(status_id) FROM statuses), 1))",
  );

  // -------------------------------------------------------------------------
  // 4. Assets — flag + URLs default quando NULL/vazio (Anexo A).
  // -------------------------------------------------------------------------
  await knex("system_settings")
    .where({ settings_id: 1 })
    .whereNull("logo_use_primary_color")
    .update({ logo_use_primary_color: true });

  for (const [column, url] of ASSET_URL_DEFAULTS) {
    await knex("system_settings")
      .where({ settings_id: 1 })
      .andWhere((qb) => qb.whereNull(column).orWhere(column, ""))
      .update({ [column]: url });
  }
}

export async function down(knex) {
  // Dados de referência — restauração manual (contrato é a fonte; não há
  // snapshot anterior confiável para categories/statuses 18–19).
  // Reverter apenas o flag de assets para o default de coluna.
  await knex("system_settings").where({ settings_id: 1 }).update({ logo_use_primary_color: false });
}
