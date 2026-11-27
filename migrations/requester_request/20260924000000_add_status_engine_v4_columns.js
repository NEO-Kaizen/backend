/**
 * Motor de Status v4 — colunas novas de `statuses` + backfill do Anexo A
 * (issue #124, delta `portal-config-statuses-amend.md`).
 *
 * 1. Enums nativos `status_triage_mode` / `status_mapping_mode`
 *    (`none | free | conclusion_only`); colunas `is_core`, `is_restricted`,
 *    `is_terminal`, `triage_mode`, `mapping_mode`.
 * 2. Backfill dos status 1–17 conforme Anexo A (isCore 6 fixos 1,3,4,7,16,17;
 *    isRestricted só 11 Priorizado; isTerminal só 16/17), incluindo `tone`
 *    (9 success, 10 error, 11 warning, 12/13 neutral, 17 error) e
 *    `visibility` (isPublic → PUBLIC/INTERNAL).
 * 3. Status 18–22 (saídas da triagem fora do Anexo A): `triage_mode
 *    conclusion_only`, `mapping_mode none`, `is_terminal` espelhando
 *    `is_final` — mantém o fluxo de triagem funcional sob a validação v4.
 */
const ANEXO_A = [
  {
    status_id: 1,
    name: "Solicitação enviada",
    is_core: true,
    is_public: true,
    is_terminal: false,
    triage_mode: "none",
    mapping_mode: "none",
    is_restricted: false,
    tone: "neutral",
  },
  {
    status_id: 2,
    name: "Aguardando triagem",
    is_core: false,
    is_public: true,
    is_terminal: false,
    triage_mode: "none",
    mapping_mode: "none",
    is_restricted: false,
    tone: "info",
  },
  {
    status_id: 3,
    name: "Em triagem",
    is_core: true,
    is_public: true,
    is_terminal: false,
    triage_mode: "free",
    mapping_mode: "none",
    is_restricted: false,
    tone: "info",
  },
  {
    status_id: 4,
    name: "Pendente de informações",
    is_core: true,
    is_public: true,
    is_terminal: false,
    triage_mode: "free",
    mapping_mode: "free",
    is_restricted: false,
    tone: "warning",
  },
  {
    status_id: 5,
    name: "Aguardando mapeamento",
    is_core: false,
    is_public: true,
    is_terminal: false,
    triage_mode: "conclusion_only",
    mapping_mode: "none",
    is_restricted: false,
    tone: "info",
  },
  {
    status_id: 6,
    name: "Mapeamento agendado",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "none",
    mapping_mode: "conclusion_only",
    is_restricted: false,
    tone: "info",
  },
  {
    status_id: 7,
    name: "Em mapeamento",
    is_core: true,
    is_public: true,
    is_terminal: false,
    triage_mode: "none",
    mapping_mode: "free",
    is_restricted: false,
    tone: "info",
  },
  {
    status_id: 8,
    name: "Em análise de viabilidade",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "free",
    mapping_mode: "free",
    is_restricted: false,
    tone: "info",
  },
  {
    status_id: 9,
    name: "Elegível",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "conclusion_only",
    mapping_mode: "conclusion_only",
    is_restricted: false,
    tone: "success",
  },
  {
    status_id: 10,
    name: "Não elegível",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "conclusion_only",
    mapping_mode: "conclusion_only",
    is_restricted: false,
    tone: "error",
  },
  {
    status_id: 11,
    name: "Priorizado",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "none",
    mapping_mode: "none",
    is_restricted: true,
    tone: "warning",
  },
  {
    status_id: 12,
    name: "Backlog",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "conclusion_only",
    mapping_mode: "conclusion_only",
    is_restricted: false,
    tone: "neutral",
  },
  {
    status_id: 13,
    name: "Direcionado para outra área",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "conclusion_only",
    mapping_mode: "conclusion_only",
    is_restricted: false,
    tone: "neutral",
  },
  {
    status_id: 14,
    name: "Em desenvolvimento",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "free",
    mapping_mode: "none",
    is_restricted: false,
    tone: "info",
  },
  {
    status_id: 15,
    name: "Em homologação",
    is_core: false,
    is_public: false,
    is_terminal: false,
    triage_mode: "free",
    mapping_mode: "none",
    is_restricted: false,
    tone: "info",
  },
  {
    status_id: 16,
    name: "Concluído",
    is_core: true,
    is_public: true,
    is_terminal: true,
    triage_mode: "conclusion_only",
    mapping_mode: "conclusion_only",
    is_restricted: false,
    tone: "success",
  },
  {
    status_id: 17,
    name: "Cancelado",
    is_core: true,
    is_public: true,
    is_terminal: true,
    triage_mode: "conclusion_only",
    mapping_mode: "conclusion_only",
    is_restricted: false,
    tone: "error",
  },
];

/** Status 18–22 criados por `20260920000000_add_triage_exit_to_statuses`. */
const TRIAGE_EXIT_EXTRA = [
  { status_id: 18, is_terminal: false },
  { status_id: 19, is_terminal: true },
  { status_id: 20, is_terminal: true },
  { status_id: 21, is_terminal: true },
  { status_id: 22, is_terminal: true },
];

export async function up(knex) {
  // Idempotente: tipos e colunas criados apenas se ainda não existirem
  // (retry de deploy não quebra).
  for (const typeName of ["status_triage_mode", "status_mapping_mode"]) {
    const exists = await knex("pg_type").where({ typname: typeName }).first();
    if (!exists) {
      await knex.raw(`CREATE TYPE ${typeName} AS ENUM ('none', 'free', 'conclusion_only')`);
    }
  }

  for (const column of ["is_core", "is_restricted", "is_terminal"]) {
    const has = await knex.schema.hasColumn("statuses", column);
    if (!has) {
      await knex.schema.alterTable("statuses", (table) => {
        table.boolean(column).notNullable().defaultTo(false);
      });
    }
  }
  for (const column of ["triage_mode", "mapping_mode"]) {
    const has = await knex.schema.hasColumn("statuses", column);
    if (!has) {
      const enumName = column === "triage_mode" ? "status_triage_mode" : "status_mapping_mode";
      await knex.schema.alterTable("statuses", (table) => {
        table
          .enu(column, ["none", "free", "conclusion_only"], {
            useNative: true,
            enumName,
            existingType: true,
          })
          .notNullable()
          .defaultTo("none");
      });
    }
  }

  // Backfill não-destrutivo: preenche apenas as colunas novas (+ espelhos
  // derivados tone/visibility/closes_request/is_final) e NUNCA renomeia —
  // customizações de `name` em produção são preservadas.
  for (const status of ANEXO_A) {
    await knex("statuses")
      .where({ status_id: status.status_id })
      .update({
        is_core: status.is_core,
        is_restricted: status.is_restricted,
        is_terminal: status.is_terminal,
        triage_mode: status.triage_mode,
        mapping_mode: status.mapping_mode,
        tone: status.tone,
        // isPublic → visibility (espelho legado: PUBLIC | INTERNAL).
        visibility: status.is_public ? "PUBLIC" : "INTERNAL",
        // Terminais de solicitação (só 16/17) também fecham no legado.
        closes_request: status.is_terminal,
        is_final: status.is_terminal,
      });
  }

  for (const extra of TRIAGE_EXIT_EXTRA) {
    // Só em ambientes que possuem 18–22 (0 rows = sem efeito, sem erro).
    await knex("statuses").where({ status_id: extra.status_id }).update({
      is_core: false,
      is_restricted: false,
      is_terminal: extra.is_terminal,
      triage_mode: "conclusion_only",
      mapping_mode: "none",
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.dropColumn("is_core");
    table.dropColumn("is_restricted");
    table.dropColumn("is_terminal");
    table.dropColumn("triage_mode");
    table.dropColumn("mapping_mode");
  });

  await knex.raw('DROP TYPE IF EXISTS "status_mapping_mode"');
  await knex.raw('DROP TYPE IF EXISTS "status_triage_mode"');
}
