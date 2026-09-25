const STATUS_1_17 = [
  {
    id: 1,
    name: "Solicitação enviada",
    isCore: true,
    isPublic: true,
    isTerminal: false,
    triageMode: "none",
    mappingMode: "none",
    isRestricted: false,
    tone: "neutral",
  },
  {
    id: 2,
    name: "Aguardando triagem",
    isCore: false,
    isPublic: true,
    isTerminal: false,
    triageMode: "none",
    mappingMode: "none",
    isRestricted: false,
    tone: "info",
  },
  {
    id: 3,
    name: "Em triagem",
    isCore: true,
    isPublic: true,
    isTerminal: false,
    triageMode: "free",
    mappingMode: "none",
    isRestricted: false,
    tone: "info",
  },
  {
    id: 4,
    name: "Pendente de informações",
    isCore: true,
    isPublic: true,
    isTerminal: false,
    triageMode: "free",
    mappingMode: "free",
    isRestricted: false,
    tone: "warning",
  },
  {
    id: 5,
    name: "Aguardando mapeamento",
    isCore: false,
    isPublic: true,
    isTerminal: false,
    triageMode: "conclusion_only",
    mappingMode: "none",
    isRestricted: false,
    tone: "info",
  },
  {
    id: 6,
    name: "Mapeamento agendado",
    isCore: true,
    isPublic: false,
    isTerminal: false,
    triageMode: "none",
    mappingMode: "conclusion_only",
    isRestricted: false,
    tone: "info",
  },
  {
    id: 7,
    name: "Em mapeamento",
    isCore: true,
    isPublic: true,
    isTerminal: false,
    triageMode: "none",
    mappingMode: "free",
    isRestricted: false,
    tone: "info",
  },
  {
    id: 8,
    name: "Em análise de viabilidade",
    isCore: false,
    isPublic: false,
    isTerminal: false,
    triageMode: "free",
    mappingMode: "free",
    isRestricted: false,
    tone: "info",
  },
  {
    id: 9,
    name: "Elegível",
    isCore: false,
    isPublic: false,
    isTerminal: false,
    triageMode: "conclusion_only",
    mappingMode: "conclusion_only",
    isRestricted: false,
    tone: "success",
  },
  {
    id: 10,
    name: "Não elegível",
    isCore: false,
    isPublic: false,
    isTerminal: false,
    triageMode: "conclusion_only",
    mappingMode: "conclusion_only",
    isRestricted: false,
    tone: "error",
  },
  {
    id: 11,
    name: "Priorizado",
    isCore: false,
    isPublic: false,
    isTerminal: false,
    triageMode: "none",
    mappingMode: "none",
    isRestricted: true,
    tone: "warning",
  },
  {
    id: 12,
    name: "Backlog",
    isCore: false,
    isPublic: false,
    isTerminal: false,
    triageMode: "conclusion_only",
    mappingMode: "conclusion_only",
    isRestricted: false,
    tone: "neutral",
  },
  {
    id: 13,
    name: "Direcionado para outra área",
    isCore: false,
    isPublic: false,
    isTerminal: false,
    triageMode: "conclusion_only",
    mappingMode: "conclusion_only",
    isRestricted: false,
    tone: "neutral",
  },
  {
    id: 14,
    name: "Em desenvolvimento",
    isCore: false,
    isPublic: false,
    isTerminal: false,
    triageMode: "free",
    mappingMode: "none",
    isRestricted: false,
    tone: "info",
  },
  {
    id: 15,
    name: "Em homologação",
    isCore: false,
    isPublic: false,
    isTerminal: false,
    triageMode: "free",
    mappingMode: "none",
    isRestricted: false,
    tone: "info",
  },
  {
    id: 16,
    name: "Concluído",
    isCore: true,
    isPublic: true,
    isTerminal: true,
    triageMode: "conclusion_only",
    mappingMode: "conclusion_only",
    isRestricted: false,
    tone: "success",
  },
  {
    id: 17,
    name: "Cancelado",
    isCore: true,
    isPublic: true,
    isTerminal: true,
    triageMode: "conclusion_only",
    mappingMode: "conclusion_only",
    isRestricted: false,
    tone: "error",
  },
];

async function addColumnIfMissing(knex, tableName, columnName, callback) {
  if (!(await knex.schema.hasColumn(tableName, columnName))) {
    await knex.schema.alterTable(tableName, (table) => callback(table));
  }
}

async function dropColumnIfExists(knex, tableName, columnName) {
  if (await knex.schema.hasColumn(tableName, columnName)) {
    await knex.schema.alterTable(tableName, (table) => table.dropColumn(columnName));
  }
}

async function addLegacyColumnIfMissing(knex, tableName, columnName, callback) {
  if (!(await knex.schema.hasColumn(tableName, columnName))) {
    await knex.schema.alterTable(tableName, (table) => callback(table));
  }
}

export async function up(knex) {
  await addColumnIfMissing(knex, "statuses", "is_public", (table) => {
    table.boolean("is_public").notNullable().defaultTo(false);
  });

  await addColumnIfMissing(knex, "requests", "last_public_status_id", (table) => {
    table
      .integer("last_public_status_id")
      .nullable()
      .references("status_id")
      .inTable("statuses")
      .onDelete("RESTRICT");
  });
  await addColumnIfMissing(knex, "mappings", "target_status_id", (table) => {
    table
      .integer("target_status_id")
      .nullable()
      .references("status_id")
      .inTable("statuses")
      .onDelete("RESTRICT");
  });
  await addColumnIfMissing(knex, "mappings", "justification", (table) => {
    table.text("justification");
  });
  await addColumnIfMissing(knex, "mappings", "last_technical_message", (table) => {
    table.text("last_technical_message");
  });
  await addColumnIfMissing(knex, "triages", "assignee_user_id", (table) => {
    table
      .integer("assignee_user_id")
      .nullable()
      .references("user_id")
      .inTable("users")
      .onDelete("SET NULL");
  });
  await addColumnIfMissing(knex, "triages", "assignee_name", (table) => {
    table.text("assignee_name");
  });
  await addColumnIfMissing(knex, "triages", "assignee_email", (table) => {
    table.text("assignee_email");
  });
  await addColumnIfMissing(knex, "triages", "last_technical_message", (table) => {
    table.text("last_technical_message");
  });
  // Internal observations: `note` guarda a justificativa interna da transição;
  // o retorno público ganha coluna dedicada (snapshot do momento do evento) —
  // nunca concatenado em `note`. `justification` foi substituído por `note`.
  await addColumnIfMissing(knex, "audit_history", "last_technical_message", (table) => {
    table.text("last_technical_message");
  });
  await addColumnIfMissing(knex, "audit_history", "ip_address", (table) => {
    table.text("ip_address");
  });
  await dropColumnIfExists(knex, "audit_history", "justification");

  if (await knex.schema.hasColumn("statuses", "visibility")) {
    await knex("statuses").where({ visibility: "PUBLIC" }).update({ is_public: true });
    await knex("statuses").where({ visibility: "INTERNAL" }).update({ is_public: false });
  }

  for (const status of STATUS_1_17) {
    await knex("statuses").where({ status_id: status.id }).update({
      is_core: status.isCore,
      is_restricted: status.isRestricted,
      is_terminal: status.isTerminal,
      triage_mode: status.triageMode,
      mapping_mode: status.mappingMode,
      tone: status.tone,
      is_public: status.isPublic,
      is_active: true,
    });
  }

  const canonicalIds = STATUS_1_17.map((status) => status.id);
  await knex("requests").whereNotIn("status_id", canonicalIds).update({ status_id: 1 });
  await knex("requests")
    .whereNotIn("last_public_status_id", canonicalIds)
    .orWhereNull("last_public_status_id")
    .update({ last_public_status_id: 1 });
  await knex("mappings")
    .whereNotNull("target_status_id")
    .whereNotIn("target_status_id", canonicalIds)
    .update({ target_status_id: null });
  await knex("triages").whereNotIn("exit_status", canonicalIds).update({ exit_status: 1 });
  await knex("statuses").whereNotIn("status_id", canonicalIds).del();

  await dropColumnIfExists(knex, "statuses", "is_triage_exit");
  await dropColumnIfExists(knex, "statuses", "closes_request");
  await dropColumnIfExists(knex, "statuses", "is_final");
  await dropColumnIfExists(knex, "statuses", "visibility");
  await knex.raw('DROP TYPE IF EXISTS "status_visibility"');
}

export async function down(knex) {
  await dropColumnIfExists(knex, "audit_history", "ip_address");
  await dropColumnIfExists(knex, "audit_history", "last_technical_message");
  await dropColumnIfExists(knex, "triages", "last_technical_message");
  await dropColumnIfExists(knex, "triages", "assignee_email");
  await dropColumnIfExists(knex, "triages", "assignee_name");
  await dropColumnIfExists(knex, "triages", "assignee_user_id");
  await dropColumnIfExists(knex, "mappings", "last_technical_message");
  await dropColumnIfExists(knex, "mappings", "justification");
  await dropColumnIfExists(knex, "mappings", "target_status_id");
  await dropColumnIfExists(knex, "requests", "last_public_status_id");

  await addLegacyColumnIfMissing(knex, "statuses", "visibility", (table) => {
    table
      .enu("visibility", ["PUBLIC", "INTERNAL"], { useNative: true, enumName: "status_visibility" })
      .notNullable()
      .defaultTo("PUBLIC");
  });
  await addLegacyColumnIfMissing(knex, "statuses", "closes_request", (table) => {
    table.boolean("closes_request").notNullable().defaultTo(false);
  });
  await addLegacyColumnIfMissing(knex, "statuses", "is_final", (table) => {
    table.boolean("is_final").notNullable().defaultTo(false);
  });
  await addLegacyColumnIfMissing(knex, "statuses", "is_triage_exit", (table) => {
    table.boolean("is_triage_exit").notNullable().defaultTo(false);
  });

  await knex("statuses").update({ visibility: "INTERNAL" }).where({ is_public: false });
  await knex("statuses").update({ visibility: "PUBLIC" }).where({ is_public: true });
  await knex("statuses")
    .update({ closes_request: true, is_final: true })
    .where({ is_terminal: true });
  await knex("statuses")
    .update({ closes_request: false, is_final: false })
    .where({ is_terminal: false });
  await knex("statuses")
    .update({ is_triage_exit: true })
    .where((builder) => builder.whereNot("triage_mode", "none").orWhereNot("mapping_mode", "none"));
  await knex("statuses")
    .update({ is_triage_exit: false })
    .where({ triage_mode: "none", mapping_mode: "none" });

  await dropColumnIfExists(knex, "statuses", "is_public");
}
