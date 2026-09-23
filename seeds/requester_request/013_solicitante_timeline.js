// Timeline rica do solicitante `solicitante_teste@email.com` (user_id 104).
//
// Pré-requisitos (seeds-base): 004_users, 005_details_professional, 006_requests.
// Necessário rodar DEPOIS de 006 (requests 21–30) e pode rodar depois de 007–011.
//
// Cobre as 10 solicitações do requester 016:
// - 21 (Solicitação enviada): sem eventos — timeline vazia.
// - 22 (Aguardando triagem): status_change 1→2 (RN-010, system).
// - 23 (Em triagem): assign + status_change 2→3.
// - 24 (Pendente de informações): assign, status_change 3→4 e nota da equipe
//   (as pendências em si vêm do 007; o anexo do comprovante do 008 fecha a
//   pendência 091).
// - 25 (Aguardando mapeamento): triagem completa + request.triage + nota.
// - 26 (Mapeamento agendado): triagem + mapping aberto (10-02 09:30) +
//   mapping.assign/save + participantes + nota.
// - 27 (Em mapeamento): triagem + mapping aberto + mapping.save + participantes.
// - 28 (Elegível): triagem + mapping concluído (10-09→10-12) + mapping.complete
//   + participantes + notas + read state.
// - 29 (Concluído): triagem + mapping concluído + participantes + notas
//   multi-autor + read state (checkpoint no meio → unseenCount > 0).
// - 30 (Não elegível): triagem com exit_status 10 + request.triage +
//   status_change para "Não elegível".
//
// Idempotente: apaga apenas o que cria (por request_id/protocol/uuid fixo) e
// recria; timelines de outras solicitações (ex.: request 1 do 012) ficam
// intocadas.
export async function seed(knex) {
  const REQUEST_IDS = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  const PROTOCOLS = [
    "MAAT-5D7K-9N3W",
    "MAAT-3F8A-2C6M",
    "MAAT-7T2E-4W8R",
    "MAAT-9X5V-3P1H",
    "MAAT-6N4B-8J9Q",
    "MAAT-2W8C-7Z5K",
    "MAAT-4M9F-6T3B",
    "MAAT-8Q6D-1R4N",
    "MAAT-1L7G-5P9A",
    "MAAT-3H8Z-9S2N",
  ];
  const MAPPING_IDS = [
    "aabbccdd-eeff-4000-8000-000000000026",
    "aabbccdd-eeff-4000-8000-000000000027",
    "aabbccdd-eeff-4000-8000-000000000028",
    "aabbccdd-eeff-4000-8000-000000000029",
  ];

  await knex("request_internal_note_read_states").whereIn("request_id", REQUEST_IDS).del();
  await knex("request_internal_notes").whereIn("request_id", REQUEST_IDS).del();

  // `audit_history` não tem FK e sobrevive ao TRUNCATE do 001 — limpeza pelos
  // ids constantes deste seed.
  await knex("audit_history")
    .where(function () {
      this.where({ entity_type: "request" }).whereIn("entity_id", PROTOCOLS);
    })
    .orWhere(function () {
      this.where({ entity_type: "mapping" }).whereIn("entity_id", MAPPING_IDS);
    })
    .del();

  await knex("mapping_participants").whereIn("mapping_id", MAPPING_IDS).del();
  await knex("mappings").whereIn("request_id", [26, 27, 28, 29]).del();
  await knex("triages").whereIn("request_id", [25, 26, 27, 28, 29, 30]).del();

  // ---------- Triagens ----------
  await knex("triages").insert([
    {
      triage_id: "f1f2f3f4-f5f6-4000-8000-000000000025",
      request_id: 25,
      adherent_to_scope: "Sim",
      adherent_justification: "",
      change_category: "Não",
      new_category: "",
      preliminary_complexity: "Média — padronização transversal das filiais.",
      perceived_risks: "Adesão das filiais ao modelo único.",
      suggested_responsible: "Bruno Analista",
      suggested_responsible_justification: "Atua em processos BPMN de padronização.",
      exit_status: 9,
      result: "Elegível",
      conclusion_justification: "Dentro do escopo do NEO; aguarda agenda de mapeamento.",
    },
    {
      triage_id: "f1f2f3f4-f5f6-4000-8000-000000000026",
      request_id: 26,
      adherent_to_scope: "Sim",
      adherent_justification: "",
      change_category: "Não",
      new_category: "",
      preliminary_complexity: "Média — integração com o portal fiscal.",
      perceived_risks: "Divergência de layout dos XML de fornecedores.",
      suggested_responsible: "Analista Teste",
      suggested_responsible_justification: "Conhece o ERP e a integração anterior.",
      exit_status: 9,
      result: "Elegível",
      conclusion_justification: "Escopo aderente; reunião de levantamento marcada.",
    },
    {
      triage_id: "f1f2f3f4-f5f6-4000-8000-000000000027",
      request_id: 27,
      adherent_to_scope: "Sim",
      adherent_justification: "",
      change_category: "Não",
      new_category: "",
      preliminary_complexity: "Média — fluxo de aprovação multi-área.",
      perceived_risks: "Rotas despadronizadas entre filiais.",
      suggested_responsible: "Bruno Analista",
      suggested_responsible_justification: "Experiência em redesenho de fluxos de compras.",
      exit_status: 9,
      result: "Elegível",
      conclusion_justification: "Aprovada na triagem; mapeamento em andamento.",
    },
    {
      triage_id: "f1f2f3f4-f5f6-4000-8000-000000000028",
      request_id: 28,
      adherent_to_scope: "Sim",
      adherent_justification: "",
      change_category: "Não",
      new_category: "",
      preliminary_complexity: "Média — consolidação de estoque multi-filial.",
      perceived_risks: "Estoque mínimo desatualizado por KBU.",
      suggested_responsible: "Roberta Analista",
      suggested_responsible_justification: "Atende categorias de dashboard e integração.",
      exit_status: 9,
      result: "Elegível",
      conclusion_justification: "Mapeamento concluído; aguarda priorização do comitê.",
    },
    {
      triage_id: "f1f2f3f4-f5f6-4000-8000-000000000029",
      request_id: 29,
      adherent_to_scope: "Sim",
      adherent_justification: "",
      change_category: "Não",
      new_category: "",
      preliminary_complexity: "Média — consolidação mensal multi-fonte.",
      perceived_risks: "Notas sem pedido geram divergência no fechamento.",
      suggested_responsible: "Roberta Analista",
      suggested_responsible_justification: "Responsável pela integração de dashboards de compras.",
      exit_status: 9,
      result: "Elegível",
      conclusion_justification: "Mapeamento concluído e validação com a área de compras.",
    },
    {
      triage_id: "f1f2f3f4-f5f6-4000-8000-000000000030",
      request_id: 30,
      adherent_to_scope: "Sim",
      adherent_justification: "Processo legítimo, mas viabilidade inviável.",
      change_category: "Não",
      new_category: "",
      preliminary_complexity: "Alta — portal proprietário com API restrita.",
      perceived_risks: "Dependência de fornecedor externo sem contrato.",
      suggested_responsible: "",
      suggested_responsible_justification: "",
      exit_status: 10,
      result: "Não elegível",
      conclusion_justification: "API restrita e custo de licença inviável.",
    },
  ]);

  // ---------- Mapeamentos ----------
  await knex("mappings").insert([
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000026",
      request_id: 26,
      professional_id: "650e8400-e29b-41d4-a716-446655440001",
      scheduled_for: "2026-10-02T12:30:00.000Z",
      duration_minutes: 60,
      modality: "REMOTE",
      meeting_link: "https://meet.empresa.com/apoio-nfe-solicitante",
      location: null,
      notes: "Reunião de levantamento da integração de NFe de entrada.",
      is_concluded: false,
      concluded_at: null,
      created_by: "analista_teste@email.com",
      created_at: "2026-09-19T14:00:00.000Z",
      updated_by: "analista_teste@email.com",
      updated_at: "2026-09-19T14:00:00.000Z",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000027",
      request_id: 27,
      professional_id: "650e8400-e29b-41d4-a716-446655440003",
      scheduled_for: "2026-09-14T13:00:00.000Z",
      duration_minutes: 90,
      modality: "IN_PERSON",
      meeting_link: null,
      location: "Sala 4 — Matriz",
      notes: "Diagnóstico do fluxo de aprovação de compras.",
      is_concluded: false,
      concluded_at: null,
      created_by: "bruno.analista@email.com",
      created_at: "2026-09-09T09:00:00.000Z",
      updated_by: "bruno.analista@email.com",
      updated_at: "2026-09-14T13:00:00.000Z",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000028",
      request_id: 28,
      professional_id: "650e8400-e29b-41d4-a716-446655440002",
      scheduled_for: "2026-09-08T14:00:00.000Z",
      duration_minutes: 60,
      modality: "REMOTE",
      meeting_link: "https://meet.empresa.com/estoque-minimo-filial",
      location: null,
      notes: "Consolidação de estoque mínimo por filial.",
      is_concluded: true,
      concluded_at: "2026-09-12T10:00:00.000Z",
      created_by: "roberta.analista@email.com",
      created_at: "2026-09-04T09:30:00.000Z",
      updated_by: "roberta.analista@email.com",
      updated_at: "2026-09-12T10:00:00.000Z",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000029",
      request_id: 29,
      professional_id: "650e8400-e29b-41d4-a716-446655440002",
      scheduled_for: "2026-08-20T10:00:00.000Z",
      duration_minutes: 90,
      modality: "IN_PERSON",
      meeting_link: null,
      location: "Sala 1 — Sede",
      notes: "Levantamento do fechamento mensal de compras.",
      is_concluded: true,
      concluded_at: "2026-08-22T14:30:00.000Z",
      created_by: "roberta.analista@email.com",
      created_at: "2026-08-19T16:00:00.000Z",
      updated_by: "roberta.analista@email.com",
      updated_at: "2026-08-22T14:30:00.000Z",
    },
  ]);

  await knex("mapping_participants").insert([
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000026",
      user_id: 101,
      name: "Analista Teste",
      email: "analista_teste@email.com",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000026",
      user_id: null,
      name: "Suprimentos NFe",
      email: "nfe.suprimentos@empresa.com",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000027",
      user_id: 108,
      name: "Bruno Analista",
      email: "bruno.analista@email.com",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000027",
      user_id: null,
      name: "Compras Matriz",
      email: "compras.matriz@empresa.com",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000028",
      user_id: 107,
      name: "Roberta Analista",
      email: "roberta.analista@email.com",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000029",
      user_id: 107,
      name: "Roberta Analista",
      email: "roberta.analista@email.com",
    },
    {
      mapping_id: "aabbccdd-eeff-4000-8000-000000000029",
      user_id: null,
      name: "Fechamento Compras",
      email: "fechamento.compras@empresa.com",
    },
  ]);

  // ---------- Notas internas ----------
  const insertedNotes = await knex("request_internal_notes")
    .insert([
      {
        request_id: 22,
        author_user_id: 101,
        author_role_at_creation: "Analista",
        content: "Solicitação recebida e aguardando início da triagem.",
        created_at: "2026-09-20T09:00:00.000Z",
      },
      {
        request_id: 24,
        author_user_id: 101,
        author_role_at_creation: "Analista",
        content: "Solicitado complemento: base consolidada de inadimplência por fornecedor.",
        created_at: "2026-09-21T09:50:00.000Z",
      },
      {
        request_id: 25,
        author_user_id: 108,
        author_role_at_creation: "Analista",
        content: "Triagem concluída; mapeador atribuído e aguardando agenda.",
        created_at: "2026-09-18T11:00:00.000Z",
      },
      {
        request_id: 26,
        author_user_id: 101,
        author_role_at_creation: "Analista",
        content: "Reunião de levantamento marcada com a área de suprimentos.",
        created_at: "2026-09-19T14:00:00.000Z",
      },
      {
        request_id: 27,
        author_user_id: 108,
        author_role_at_creation: "Analista",
        content: "Mapeamento em andamento; fluxo de aprovação diagnosticado.",
        created_at: "2026-09-16T10:00:00.000Z",
      },
      {
        request_id: 28,
        author_user_id: 107,
        author_role_at_creation: "Analista",
        content: "Mapeamento concluído; encaminhando para priorização do comitê.",
        created_at: "2026-09-12T10:05:00.000Z",
      },
      {
        request_id: 28,
        author_user_id: 102,
        author_role_at_creation: "Administrador",
        content: "Priorizado com prioridade Alta no comitê de setembro.",
        created_at: "2026-09-15T14:00:00.000Z",
      },
      {
        request_id: 29,
        author_user_id: 107,
        author_role_at_creation: "Analista",
        content: "Levantamento do fechamento mensal realizado com a área de compras.",
        created_at: "2026-08-20T11:00:00.000Z",
      },
      {
        request_id: 29,
        author_user_id: 101,
        author_role_at_creation: "Analista",
        content: "Pendências respondidas e validadas; dashboard em desenvolvimento.",
        created_at: "2026-08-28T14:10:00.000Z",
      },
      {
        request_id: 29,
        author_user_id: 107,
        author_role_at_creation: "Analista",
        content: "Entregue e validado com a área de compras. Solicitação concluída.",
        created_at: "2026-09-19T17:00:00.000Z",
      },
    ])
    .returning(["internal_note_id", "request_id"]);

  const noteByRequest = insertedNotes.reduce((acc, note) => {
    (acc[note.request_id] ??= []).push(note.internal_note_id);
    return acc;
  }, {});

  // Checkpoint de leitura: usuário interno leu até a nota do meio → posterior
  // (ex.: a de priorização/entrega) fica como não lida (unseenCount > 0).
  await knex("request_internal_note_read_states").insert([
    {
      request_id: 28,
      user_id: 101,
      last_read_note_id: noteByRequest[28][0],
      read_at: knex.fn.now(),
    },
    {
      request_id: 29,
      user_id: 101,
      last_read_note_id: noteByRequest[29][1],
      read_at: knex.fn.now(),
    },
  ]);

  // ---------- Auditoria ----------
  await knex("audit_history").insert([
    // 22 — entrada na fila (RN-010, transição automática).
    {
      entity_type: "request",
      entity_id: "MAAT-3F8A-2C6M",
      action_type: "request.status_change",
      previous_value: "Solicitação enviada",
      new_value: "Aguardando triagem",
      user_id: null,
      occurred_at: "2026-09-19T14:30:00.000Z",
      note: "RN-010",
      change_origin: "system",
    },
    // 23 — atribuição e entrada em triagem.
    {
      entity_type: "request",
      entity_id: "MAAT-7T2E-4W8R",
      action_type: "request.assign",
      previous_value: null,
      new_value: "101",
      user_id: 102,
      occurred_at: "2026-09-20T10:00:00.000Z",
      note: "seed timeline",
      change_origin: "admin",
    },
    {
      entity_type: "request",
      entity_id: "MAAT-7T2E-4W8R",
      action_type: "request.status_change",
      previous_value: "Aguardando triagem",
      new_value: "Em triagem",
      user_id: 101,
      occurred_at: "2026-09-21T09:00:00.000Z",
      change_origin: "admin",
    },
    // 24 — pendente de informações (pendências criadas no 007).
    {
      entity_type: "request",
      entity_id: "MAAT-9X5V-3P1H",
      action_type: "request.status_change",
      previous_value: "Em triagem",
      new_value: "Pendente de informações",
      user_id: 101,
      occurred_at: "2026-09-21T09:45:00.000Z",
      note: "Pendências enviadas ao solicitante.",
      change_origin: "admin",
    },
    // 25 — triagem elegível.
    {
      entity_type: "request",
      entity_id: "MAAT-6N4B-8J9Q",
      action_type: "request.triage",
      previous_value: JSON.stringify({ status: "Em triagem", category: "Padronização" }),
      new_value: JSON.stringify({
        triageId: "f1f2f3f4-f5f6-4000-8000-000000000025",
        exitStatus: 9,
        status: "Elegível",
      }),
      user_id: 108,
      occurred_at: "2026-09-18T11:00:00.000Z",
      change_origin: "admin",
    },
    // 26 — triagem + mapping.assign/save (aberto, agendado).
    {
      entity_type: "request",
      entity_id: "MAAT-2W8C-7Z5K",
      action_type: "request.triage",
      previous_value: JSON.stringify({ status: "Em triagem", category: "Apoio técnico" }),
      new_value: JSON.stringify({
        triageId: "f1f2f3f4-f5f6-4000-8000-000000000026",
        exitStatus: 9,
        status: "Elegível",
      }),
      user_id: 101,
      occurred_at: "2026-09-18T15:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000026",
      action_type: "mapping.assign",
      previous_value: null,
      new_value: "650e8400-e29b-41d4-a716-446655440001",
      user_id: 102,
      occurred_at: "2026-09-19T14:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000026",
      action_type: "mapping.save",
      previous_value: null,
      new_value: JSON.stringify({
        scheduledFor: "2026-10-02T12:30:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440001",
      }),
      user_id: 101,
      occurred_at: "2026-09-19T14:05:00.000Z",
      change_origin: "internal",
    },
    // 27 — triagem + mapping.save (em andamento).
    {
      entity_type: "request",
      entity_id: "MAAT-4M9F-6T3B",
      action_type: "request.triage",
      previous_value: JSON.stringify({ status: "Em triagem", category: "Revisão de processo" }),
      new_value: JSON.stringify({
        triageId: "f1f2f3f4-f5f6-4000-8000-000000000027",
        exitStatus: 9,
        status: "Elegível",
      }),
      user_id: 108,
      occurred_at: "2026-09-15T16:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000027",
      action_type: "mapping.assign",
      previous_value: null,
      new_value: "650e8400-e29b-41d4-a716-446655440003",
      user_id: 102,
      occurred_at: "2026-09-09T09:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000027",
      action_type: "mapping.save",
      previous_value: null,
      new_value: JSON.stringify({
        scheduledFor: "2026-09-14T13:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440003",
      }),
      user_id: 108,
      occurred_at: "2026-09-14T13:00:00.000Z",
      change_origin: "internal",
    },
    // 28 — triagem + mapping completo.
    {
      entity_type: "request",
      entity_id: "MAAT-8Q6D-1R4N",
      action_type: "request.triage",
      previous_value: JSON.stringify({ status: "Em triagem", category: "Dashboard ou relatório" }),
      new_value: JSON.stringify({
        triageId: "f1f2f3f4-f5f6-4000-8000-000000000028",
        exitStatus: 9,
        status: "Elegível",
      }),
      user_id: 107,
      occurred_at: "2026-09-13T10:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000028",
      action_type: "mapping.assign",
      previous_value: null,
      new_value: "650e8400-e29b-41d4-a716-446655440002",
      user_id: 102,
      occurred_at: "2026-09-04T09:30:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000028",
      action_type: "mapping.save",
      previous_value: null,
      new_value: JSON.stringify({
        scheduledFor: "2026-09-08T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440002",
      }),
      user_id: 107,
      occurred_at: "2026-09-08T14:00:00.000Z",
      change_origin: "internal",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000028",
      action_type: "mapping.complete",
      previous_value: JSON.stringify({
        scheduledFor: "2026-09-08T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440002",
      }),
      new_value: JSON.stringify({
        scheduledFor: "2026-09-08T14:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440002",
        is_concluded: true,
      }),
      user_id: 107,
      occurred_at: "2026-09-12T10:00:00.000Z",
      change_origin: "internal",
    },
    // 29 — triagem + mapping completo (timeline mais rica).
    {
      entity_type: "request",
      entity_id: "MAAT-1L7G-5P9A",
      action_type: "request.triage",
      previous_value: JSON.stringify({ status: "Em triagem", category: "Dashboard ou relatório" }),
      new_value: JSON.stringify({
        triageId: "f1f2f3f4-f5f6-4000-8000-000000000029",
        exitStatus: 9,
        status: "Elegível",
      }),
      user_id: 107,
      occurred_at: "2026-08-19T10:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000029",
      action_type: "mapping.assign",
      previous_value: null,
      new_value: "650e8400-e29b-41d4-a716-446655440002",
      user_id: 102,
      occurred_at: "2026-08-19T16:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000029",
      action_type: "mapping.save",
      previous_value: null,
      new_value: JSON.stringify({
        scheduledFor: "2026-08-20T10:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440002",
      }),
      user_id: 107,
      occurred_at: "2026-08-20T10:00:00.000Z",
      change_origin: "internal",
    },
    {
      entity_type: "mapping",
      entity_id: "aabbccdd-eeff-4000-8000-000000000029",
      action_type: "mapping.complete",
      previous_value: JSON.stringify({
        scheduledFor: "2026-08-20T10:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440002",
      }),
      new_value: JSON.stringify({
        scheduledFor: "2026-08-20T10:00:00.000Z",
        mappingAssigneeId: "650e8400-e29b-41d4-a716-446655440002",
        is_concluded: true,
      }),
      user_id: 107,
      occurred_at: "2026-08-22T14:30:00.000Z",
      change_origin: "internal",
    },
    // 30 — triagem não elegível.
    {
      entity_type: "request",
      entity_id: "MAAT-3H8Z-9S2N",
      action_type: "request.triage",
      previous_value: JSON.stringify({ status: "Em triagem", category: "Estudo de viabilidade" }),
      new_value: JSON.stringify({
        triageId: "f1f2f3f4-f5f6-4000-8000-000000000030",
        exitStatus: 10,
        status: "Não elegível",
      }),
      user_id: 101,
      occurred_at: "2026-09-14T16:00:00.000Z",
      change_origin: "admin",
    },
    {
      entity_type: "request",
      entity_id: "MAAT-3H8Z-9S2N",
      action_type: "request.status_change",
      previous_value: "Em triagem",
      new_value: "Não elegível",
      user_id: 101,
      occurred_at: "2026-09-14T16:01:00.000Z",
      change_origin: "admin",
    },
  ]);

  await knex.raw(
    "SELECT setval(pg_get_serial_sequence('request_internal_notes','internal_note_id'), (SELECT COALESCE(MAX(internal_note_id), 1) FROM request_internal_notes))",
  );
  await knex.raw(
    "SELECT setval(pg_get_serial_sequence('audit_history','audit_id'), (SELECT COALESCE(MAX(audit_id), 1) FROM audit_history))",
  );
}
