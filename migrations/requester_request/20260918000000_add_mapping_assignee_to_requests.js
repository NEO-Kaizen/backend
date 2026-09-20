export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("requests", "mapping_professional_id");
  if (!hasColumn) {
    await knex.schema.alterTable("requests", (table) => {
      // SET NULL replica o comportamento de requests.professional_id (202609100006_create_requests.js:87):
      // se o details_professional for removido, a solicitação permanece com histórico,
      // apenas o vínculo de responsável de mapeamento é nulificado.
      // Alternativas: RESTRICT bloquearia exclusão do profissional; CASCADE apagaria a solicitação (inaceitável).
      table
        .uuid("mapping_professional_id")
        .nullable()
        .references("professional_id")
        .inTable("details_professional")
        .onDelete("SET NULL");
      table.index("mapping_professional_id", "idx_requests_mapping_professional");
    });
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("requests", "mapping_professional_id");
  if (hasColumn) {
    await knex.schema.alterTable("requests", (table) => {
      table.dropIndex("mapping_professional_id", "idx_requests_mapping_professional");
      table.dropColumn("mapping_professional_id");
    });
  }
}
