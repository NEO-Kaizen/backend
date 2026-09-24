const RICH_REQUEST_ID = 1;
const RICH_PROTOCOL = "MAAT-8K3P-9X2M";
const RICH_MAPPING_ID = "aaaaaaaa-aaaa-4000-8000-000000000021";
const OLDER_MAPPING_ID = "aaaaaaaa-aaaa-4000-8000-000000000020";

const TRIAGE_ASSESSMENT = {
  id: "6f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f",
  adherentToScope: "Sim",
  adherentJustification: "",
  changeCategory: "Não",
  newCategory: "",
  preliminaryComplexity: "Média — integração com ERP do fornecedor exige mapeamento prévio.",
  perceivedRisks: "Atraso na resposta do fornecedor sobre credenciais de API.",
  suggestedResponsible: "Bruno Analista",
  suggestedResponsibleJustification: "Conhece a integração ERP anterior do mesmo fornecedor.",
  exitStatus: 9,
  result: "Elegível para avaliação",
  conclusionJustification: "Dentro do escopo do NEO; seguir para priorização.",
};

// Reavaliação posterior (2ª versão do histórico `triages`) — muda a categoria
// de destino e mantém o registro inicial como primeira entrada.
const TRIAGE_REASSESSMENT = {
  id: "7a2d3b9f-4e5c-4d6b-8f80-2b3c4d5e6f70",
  adherentToScope: "Sim",
  adherentJustification: "",
  changeCategory: "Sim",
  newCategory: "Automação",
  preliminaryComplexity: "Alta — nova categoria eleva a complexidade de integração.",
  perceivedRisks: "Dependência de aprovação orçamentária da área.",
  suggestedResponsible: "Diego Analista",
  suggestedResponsibleJustification: "Assume a frente após a revisão de escopo.",
  exitStatus: 18,
  result: "Reavaliada e elegível",
  conclusionJustification: "Escopo revisado com a área; categoria ajustada para Automação.",
};

/**
 * Timeline rica de exemplo para `MAAT-8K3P-9X2M` (request_id 1).
 *
 * Pré-requisitos (seeds-base): 004_users, 005_details_professional, 006_requests.
 *
 * Cobre:
 * - 5 notas multi-autor com timestamps intercalados aos eventos;
 * - eventos das 5 ações (request.assign/reassign/unassign/status_change + mapping.assign)
 *   com `text` já composável pelo service e `actor` via join;
 * - 2 versões de triagem em `triages` (inicial + reavaliação) + 2 `request.triage`
 *   em audit (proveniência: occurredAt/actor/changeOrigin via join);
 * - 2 esforços de mapeamento em `mappings` (anterior concluído + atual concluído)
 *   + participantes + `mapping.save|complete|assign` em audit;
 * - checkpoint de leitura (`request_internal_note_read_states`) para `unseenCount > 0`.
 *
 * Idempotente: apaga apenas os registros que cria (por `request_id`/`protocol`/uuid fixo)
 * e recria; estados de outras solicitações (ex.: MAAT-2R7Q-4M1C) ficam intocados,
 * demonstrando o estado vazio (`triages: []`, `mappings: []`).
 */
export async function seed(knex) {
  await knex("request_internal_note_read_states").where({ request_id: RICH_REQUEST_ID }).del();

  await knex("request_internal_notes").where({ request_id: RICH_REQUEST_ID }).del();

  // UUIDs fixos (não pluck): o 001 faz `TRUNCATE requests CASCADE` no início
  // de cada seed:run, apagando `mappings` antes deste ponto — mas
  // `audit_history` não tem FK, então os audits viram órfãos e só podem ser
  // limpos pelos ids constantes deste seed.
  const seedMappingIds = [RICH_MAPPING_ID, OLDER_MAPPING_ID];

  await knex.raw(
    "ALTER TABLE audit_history DISABLE TRIGGER trg_audit_history_prevent_update_delete;",
  );
  try {
    await knex("audit_history")
      .where(function () {
        this.where({ entity_type: "request", entity_id: RICH_PROTOCOL });
      })
      .orWhere(function () {
        this.where({ entity_type: "mapping" }).whereIn("entity_id", seedMappingIds);
      })
      .del();
  } finally {
    await knex.raw(
      "ALTER TABLE audit_history ENABLE TRIGGER trg_audit_history_prevent_update_delete;",
    );
  }

  await knex("mapping_participants").whereIn("mapping_id", seedMappingIds).del();
  await knex("mappings").where({ request_id: RICH_REQUEST_ID }).del();
  await knex("triages").where({ request_id: RICH_REQUEST_ID }).del();

  const insertedNotes = await knex("request_internal_notes")
    .insert([
      {
        request_id: RICH_REQUEST_ID,
        author_user_id: 101,
        author_role_at_creation: "Analista",
        content: "Recebemos a solicitação e vamos iniciar a análise preliminar.",
        created_at: "2026-07-02T09:15:00.000Z",
      },
      {
        request_id: RICH_REQUEST_ID,
        author_user_id: 102,
        author_role_at_creation: "Administrador",
        content: "Confirmar alçada de aprovação com o financeiro antes do mapeamento.",
        created_at: "2026-07-03T11:40:00.000Z",
      },
      {
        request_id: RICH_REQUEST_ID,
        author_user_id: 101,
        author_role_at_creation: "Analista",
        content: "Reunião de kickoff realizada; área disponível na próxima semana.",
        created_at: "2026-07-05T16:05:00.000Z",
      },
      {
        request_id: RICH_REQUEST_ID,
        author_user_id: 107,
        author_role_at_creation: "Analista",
        content: "Mapeamento concluído; encaminhando para priorização.",
        created_at: "2026-08-12T10:20:00.000Z",
      },
      {
        request_id: RICH_REQUEST_ID,
        author_user_id: 102,
        author_role_at_creation: "Administrador",
        content: "Priorizado para o ciclo de outubro.",
        created_at: "2026-09-02T14:00:00.000Z",
      },
    ])
    .returning("internal_note_id");

  const checkpointNoteId = String(insertedNotes[2].internal_note_id);
  await knex("request_internal_note_read_states").insert({
    request_id: RICH_REQUEST_ID,
    user_id: 101,
    last_read_note_id: checkpointNoteId,
    read_at: knex.fn.now(),
  });

  await knex("audit_history").insert([
    {
      entity_type: "request",
      entity_id: RICH_PROTOCOL,
      action_type: "request.assign",
      previous_value: null,
      new_value: "101",
      user_id: 102,
      occurred_at: "2026-07-02T09:05:00.000Z",
      note: "seed timeline",
      change_origin: "admin",
    },
    {
      entity_type: "request",
      entity_id: RICH_PROTOCOL,
      action_type: "request.status_change",
      previous_value: "Aguardando triagem",
      new_value: "Em triagem",
      user_id: 101,
      occurred_at: "2026-07-02T09:06:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "request",
      entity_id: RICH_PROTOCOL,
      action_type: "request.reassign",
      previous_value: "101",
      new_value: "107",
      user_id: 102,
      occurred_at: "2026-07-04T09:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "request",
      entity_id: RICH_PROTOCOL,
      action_type: "request.status_change",
      previous_value: "Em triagem",
      new_value: "Aguardando mapeamento",
      user_id: null,
      occurred_at: "2026-07-20T10:00:00.000Z",
      note: "RN-010",
      change_origin: "system",
    },
    {
      entity_type: "request",
      entity_id: RICH_PROTOCOL,
      action_type: "request.triage",
      previous_value: JSON.stringify({ status: "Em triagem", category: "Automação" }),
      new_value: JSON.stringify({
        triageId: TRIAGE_ASSESSMENT.id,
        exitStatus: TRIAGE_ASSESSMENT.exitStatus,
        status: "Elegível",
      }),
      user_id: 101,
      occurred_at: "2026-07-18T14:30:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "request",
      entity_id: RICH_PROTOCOL,
      action_type: "request.triage",
      previous_value: JSON.stringify({ status: "Elegível", category: "Automação" }),
      new_value: JSON.stringify({
        triageId: TRIAGE_REASSESSMENT.id,
        exitStatus: TRIAGE_REASSESSMENT.exitStatus,
        status: "Elegível para avaliação",
      }),
      user_id: 107,
      occurred_at: "2026-08-20T09:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "request",
      entity_id: RICH_PROTOCOL,
      action_type: "request.unassign",
      previous_value: "107",
      new_value: null,
      user_id: 102,
      occurred_at: "2026-09-01T09:00:00.000Z",
      change_origin: "admin",
    },
  ]);

  await knex("triages").insert([
    {
      triage_id: TRIAGE_ASSESSMENT.id,
      request_id: RICH_REQUEST_ID,
      adherent_to_scope: TRIAGE_ASSESSMENT.adherentToScope,
      adherent_justification: TRIAGE_ASSESSMENT.adherentJustification,
      change_category: TRIAGE_ASSESSMENT.changeCategory,
      new_category: TRIAGE_ASSESSMENT.newCategory,
      preliminary_complexity: TRIAGE_ASSESSMENT.preliminaryComplexity,
      perceived_risks: TRIAGE_ASSESSMENT.perceivedRisks,
      suggested_responsible: TRIAGE_ASSESSMENT.suggestedResponsible,
      suggested_responsible_justification: TRIAGE_ASSESSMENT.suggestedResponsibleJustification,
      exit_status: TRIAGE_ASSESSMENT.exitStatus,
      result: TRIAGE_ASSESSMENT.result,
      conclusion_justification: TRIAGE_ASSESSMENT.conclusionJustification,
    },
    {
      triage_id: TRIAGE_REASSESSMENT.id,
      request_id: RICH_REQUEST_ID,
      adherent_to_scope: TRIAGE_REASSESSMENT.adherentToScope,
      adherent_justification: TRIAGE_REASSESSMENT.adherentJustification,
      change_category: TRIAGE_REASSESSMENT.changeCategory,
      new_category: TRIAGE_REASSESSMENT.newCategory,
      preliminary_complexity: TRIAGE_REASSESSMENT.preliminaryComplexity,
      perceived_risks: TRIAGE_REASSESSMENT.perceivedRisks,
      suggested_responsible: TRIAGE_REASSESSMENT.suggestedResponsible,
      suggested_responsible_justification: TRIAGE_REASSESSMENT.suggestedResponsibleJustification,
      exit_status: TRIAGE_REASSESSMENT.exitStatus,
      result: TRIAGE_REASSESSMENT.result,
      conclusion_justification: TRIAGE_REASSESSMENT.conclusionJustification,
    },
  ]);

  // Esforço ANTERIOR (concluído) — 1ª entrada de `mappings[]`; datas entre a
  // triagem inicial (07-18 / "Aguardando mapeamento" 07-20) e o esforço atual
  // (08-05), para a narrativa seguir o fluxo triagem → mapeamento e o
  // `GET /mapping` continuar devolvendo o esforço rico mais recente.
  await knex("mappings").insert({
    mapping_id: OLDER_MAPPING_ID,
    request_id: RICH_REQUEST_ID,
    professional_id: "650e8400-e29b-41d4-a716-446655440001",
    scheduled_for: "2026-07-29T14:00:00.000Z",
    duration_minutes: 45,
    modality: "IN_PERSON",
    meeting_link: null,
    location: "Sala 3 — Sede",
    notes: "Levantamento inicial de requisitos.",
    is_concluded: true,
    concluded_at: "2026-08-01T11:00:00.000Z",
    created_by: "analista_teste@email.com",
    created_at: "2026-07-25T09:00:00.000Z",
    updated_by: "analista_teste@email.com",
    updated_at: "2026-08-01T11:00:00.000Z",
  });

  await knex("mappings").insert({
    mapping_id: RICH_MAPPING_ID,
    request_id: RICH_REQUEST_ID,
    professional_id: "650e8400-e29b-41d4-a716-446655440003",
    scheduled_for: "2026-08-15T14:00:00.000Z",
    duration_minutes: 60,
    modality: "REMOTE",
    meeting_link: "https://meet.empresa.com/maat-8k3p",
    location: null,
    notes: "Levar checklist da última integração.",
    is_concluded: true,
    concluded_at: "2026-08-12T10:20:00.000Z",
    created_by: "analista_teste@email.com",
    created_at: "2026-08-05T09:00:00.000Z",
    updated_by: "analista_teste@email.com",
    updated_at: "2026-08-12T10:20:00.000Z",
  });

  await knex("mapping_participants").insert([
    {
      mapping_id: RICH_MAPPING_ID,
      user_id: 101,
      name: "Analista Teste",
      email: "analista_teste@email.com",
    },
    {
      mapping_id: RICH_MAPPING_ID,
      user_id: null,
      name: "Fornecedor Acme",
      email: "contato@acme.com",
    },
    {
      mapping_id: OLDER_MAPPING_ID,
      user_id: 101,
      name: "Analista Teste",
      email: "analista_teste@email.com",
    },
  ]);

  await knex("audit_history").insert([
    {
      entity_type: "mapping",
      entity_id: RICH_MAPPING_ID,
      action_type: "mapping.assign",
      previous_value: null,
      new_value: "650e8400-e29b-41d4-a716-446655440003",
      user_id: 102,
      occurred_at: "2026-08-05T09:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: RICH_MAPPING_ID,
      action_type: "mapping.save",
      previous_value: null,
      new_value: JSON.stringify({
        scheduledFor: "2026-08-15T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440003",
      }),
      user_id: 101,
      occurred_at: "2026-08-10T10:00:00.000Z",
      change_origin: "internal",
    },
    {
      entity_type: "mapping",
      entity_id: RICH_MAPPING_ID,
      action_type: "mapping.assign",
      previous_value: "650e8400-e29b-41d4-a716-446655440003",
      new_value: "650e8400-e29b-41d4-a716-446655440004",
      user_id: 103,
      occurred_at: "2026-08-11T15:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: RICH_MAPPING_ID,
      action_type: "mapping.complete",
      previous_value: JSON.stringify({
        scheduledFor: "2026-08-15T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440003",
      }),
      new_value: JSON.stringify({
        scheduledFor: "2026-08-15T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440004",
        is_concluded: true,
      }),
      user_id: 101,
      occurred_at: "2026-08-12T10:20:00.000Z",
      change_origin: "internal",
    },
    {
      entity_type: "mapping",
      entity_id: OLDER_MAPPING_ID,
      action_type: "mapping.assign",
      previous_value: null,
      new_value: "650e8400-e29b-41d4-a716-446655440001",
      user_id: 102,
      occurred_at: "2026-07-25T09:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: OLDER_MAPPING_ID,
      action_type: "mapping.save",
      previous_value: null,
      new_value: JSON.stringify({
        scheduledFor: "2026-07-29T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440001",
      }),
      user_id: 101,
      occurred_at: "2026-07-26T10:00:00.000Z",
      change_origin: "internal",
    },
    {
      entity_type: "mapping",
      entity_id: OLDER_MAPPING_ID,
      action_type: "mapping.complete",
      previous_value: JSON.stringify({
        scheduledFor: "2026-07-29T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440001",
      }),
      new_value: JSON.stringify({
        scheduledFor: "2026-07-29T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440001",
        is_concluded: true,
      }),
      user_id: 101,
      occurred_at: "2026-08-01T11:00:00.000Z",
      change_origin: "internal",
    },
  ]);

  await knex.raw(
    "SELECT setval(pg_get_serial_sequence('request_internal_notes','internal_note_id'), (SELECT COALESCE(MAX(internal_note_id), 1) FROM request_internal_notes))",
  );
  await knex.raw(
    "SELECT setval(pg_get_serial_sequence('audit_history','audit_id'), (SELECT COALESCE(MAX(audit_id), 1) FROM audit_history))",
  );
}
