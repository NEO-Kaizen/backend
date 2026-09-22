const RICH_REQUEST_ID = 1;
const RICH_PROTOCOL = "MAAT-8K3P-9X2M";
const RICH_MAPPING_ID = "aaaaaaaa-aaaa-4000-8000-000000000021";

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

/**
 * Timeline rica de exemplo para `MAAT-8K3P-9X2M` (request_id 1).
 *
 * Pré-requisitos (seeds-base): 004_users, 005_details_professional, 006_requests.
 *
 * Cobre:
 * - 5 notas multi-autor com timestamps intercalados aos eventos;
 * - eventos das 5 ações (request.assign/reassign/unassign/status_change + mapping.assign)
 *   com `text` já composável pelo service e `actor` via join;
 * - `triage` em `requests.internal_notes.__triage` + `request.triage` em audit;
 * - `mappings` + `mapping_participants` concluído + `mapping.save|complete|assign` em audit;
 * - checkpoint de leitura (`request_internal_note_read_states`) para `unseenCount > 0`.
 *
 * Idempotente: apaga apenas os registros que cria (por `request_id`/`protocol`/uuid fixo)
 * e recria; estados de outras solicitações (ex.: MAAT-2R7Q-4M1C) ficam intocados,
 * demonstrando o estado vazio (`triage: null`, mapping vazio).
 */
export async function seed(knex) {
  await knex("request_internal_note_read_states").where({ request_id: RICH_REQUEST_ID }).del();

  await knex("request_internal_notes").where({ request_id: RICH_REQUEST_ID }).del();

  await knex("audit_history")
    .where(function () {
      this.where({ entity_type: "request", entity_id: RICH_PROTOCOL });
    })
    .orWhere(function () {
      this.where({ entity_type: "mapping", entity_id: RICH_MAPPING_ID });
    })
    .del();

  await knex("mapping_participants").where({ mapping_id: RICH_MAPPING_ID }).del();
  await knex("mappings").where({ mapping_id: RICH_MAPPING_ID }).del();

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
        status: "Elegível para avaliação",
      }),
      user_id: 101,
      occurred_at: "2026-07-18T14:30:00.000Z",
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
  ]);

  const requestRow = await knex("requests")
    .where({ protocol: RICH_PROTOCOL })
    .first("internal_notes");
  let merged = {};
  const rawNotes = requestRow?.internal_notes;
  if (rawNotes) {
    try {
      const parsed = JSON.parse(String(rawNotes));
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        merged = { ...parsed };
      } else {
        merged = { observations: String(rawNotes) };
      }
    } catch {
      merged = { observations: String(rawNotes) };
    }
  }
  merged.__triage = TRIAGE_ASSESSMENT;

  await knex("requests")
    .where({ protocol: RICH_PROTOCOL })
    .update({
      internal_notes: JSON.stringify(merged),
      updated_at: knex.fn.now(),
    });

  await knex.raw(
    "SELECT setval(pg_get_serial_sequence('request_internal_notes','internal_note_id'), (SELECT COALESCE(MAX(internal_note_id), 1) FROM request_internal_notes))",
  );
  await knex.raw(
    "SELECT setval(pg_get_serial_sequence('audit_history','audit_id'), (SELECT COALESCE(MAX(audit_id), 1) FROM audit_history))",
  );
}
