/**
 * Fonte única dos status de solicitação — alimenta a union `RequestStatus`, a
 * validação (Zod) e as métricas da fila. Mantenha os nomes alinhados à tabela
 * `statuses` (migration `202609100013_insert_reference_data`).
 */
export const REQUEST_STATUSES = [
  "Solicitação enviada",
  "Aguardando triagem",
  "Em triagem",
  "Pendente de informações",
  "Aguardando mapeamento",
  "Mapeamento agendado",
  "Em mapeamento",
  "Em análise de viabilidade",
  "Elegível",
  "Não elegível",
  "Priorizado",
  "Backlog",
  "Direcionado para outra área",
  "Em desenvolvimento",
  "Em homologação",
  "Concluído",
  "Cancelado",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Fonte única das prioridades — alimenta a union e a validação (Zod). */
export const REQUEST_PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;

export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

/** Status considerados "em andamento" para as métricas da fila (Home/Fila). */
export const IN_PROGRESS_STATUSES = [
  "Em triagem",
  "Em mapeamento",
  "Em análise de viabilidade",
  "Em desenvolvimento",
  "Em homologação",
] as const;

/** Status terminais sem entrega — excluídos das métricas de atraso da fila. */
export const TERMINAL_STATUSES = ["Concluído", "Cancelado"] as const;

export type TriageResult =
  | "Elegível para avaliação"
  | "Pendente de informações"
  | "Fora do escopo"
  | "Direcionada para outra área"
  | "Duplicada"
  | "Cancelada"
  | "Backlog";

export type OperationalImpact = "Baixo" | "Médio" | "Alto" | "Crítico";

export type YesNoDetail = false | string;

export type RequestCategory =
  | "Automação"
  | "Melhoria de processo"
  | "Indicador"
  | "Dashboard ou relatório"
  | "Análise de dados"
  | "Padronização"
  | "Revisão de processo"
  | "Apoio técnico"
  | "Estudo de viabilidade"
  | "Outros";

export interface AttachmentMetadata {
  fileName: string; // nome original do arquivo — máx. 255
  mimeType: string; // PDF, DOCX, XLSX, PNG ou JPG
  sizeBytes: number; // máximo 10 * 1024 * 1024 (10MB)
}

export interface RequesterBlock {
  fullName: string; // obrigatório — máx. 150
  corporateEmail: string; // obrigatório — e-mail corporativo, máx. 254 (RFC 5321)
  area: string; // obrigatório — máx. 100
  department?: string; // opcional (padrão; Admin pode tornar obrigatório) — máx. 100
  // renderização híbrida: <Select> se houver departamentos
  // cadastrados; texto livre caso contrário (§1.1)
  manager: string; // obrigatório — gestor responsável, máx. 150
  additionalContact?: string; // opcional — telefone, ramal ou e-mail secundário, máx. 100
}

export interface DemandBlock {
  title: string; // obrigatório — título resumido, máx. 150
  requestType: string; // obrigatório — Tipo de Solicitação (modalidade macro,
  // ex.: Automação, Manutenção, Nova Demanda), máx. 80
  category: string; // obrigatório — Categoria da Demanda (validada contra o
  // cadastro ativo; nomes em RequestCategory são a referência base), máx. 80
  processName: string; // obrigatório — nome formal do processo atual, máx. 150
  description: string; // obrigatório — Descrição da Necessidade, máx. 4.000
  problem: string; // obrigatório — Problema ou Oportunidade Identificada, máx. 4.000
  expectedResult: string; // obrigatório — Resultado Esperado, máx. 4.000
  justification: string; // obrigatório — Justificativa da Solicitação, máx. 4.000
}

export interface OperationalBlock {
  processDescription: string; // 1 — descrição resumida do processo atual, máx. 4.000
  processSteps: string; // 2 — principais etapas em tópicos/passo a passo, máx. 4.000
  systemsUsed: string; // 3 — softwares, ERPs, planilhas envolvidos, máx. 255
  executionFrequency: string; // 4 — Diária, Semanal, Mensal, Por Demanda etc., máx. 50
  volumetry: string; // 5 — ex.: "500 transações/mês", máx. 100
  peopleInvolved: number; // 6 — headcount alocado (INTEGER > 0)
  averageExecutionTime: string; // 7 — tempo médio por ciclo, ex.: "15 minutos", máx. 60
  monthlyEffortHours: number; // 8 — esforço mensal estimado em horas (DECIMAL(10,2))
  hasManualControls: YesNoDetail; // 9 — controles manuais: false ou texto do
  //      detalhamento (obrigatório junto do "Sim")
  mainRisks: string; // 10 — riscos de erro/compliance/operacionais, máx. 2.000
  clientImpact: string; // 11 — reflexo no cliente interno/externo, máx. 2.000
  operationalImpact: OperationalImpact; // 12 — Baixo/Médio/Alto/Crítico
  desiredDeadline: string; // 13 — prazo desejado, data ISO "yyyy-mm-dd"
  perceivedCriticality: RequestPriority; // 14 — criticidade percebida pelo solicitante
}

export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail; // existência de documentação do processo (+ links)
  hasSimilarSolution?: YesNoDetail; // existência de solução semelhante
  dependsOnOtherAreas?: YesNoDetail; // dependência de outras áreas (+ quais)
  handlesRestrictedInfo?: YesNoDetail; // tratamento de informações restritas (LGPD/sigilo)
  additionalNotes?: string; // observações adicionais, máx. 2.000
}

export type SchedulePreferences = string[]; // ISO "yyyy-mm-ddThh:mm" — max 3

export interface RequesterTable {
  requester_id: string;
  full_name: string;
  corporate_email: string;
  area: string;
  department: string | null;
  manager_name: string;
  additional_contact: string | null;
  created_at: Date;
}

export interface AssignmentContextRow {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  status: RequestStatus;
  screening_result: string | null;
}

export interface AssignmentCandidateRow {
  id: string;
  name: string;
  email: string;
  professional_status: "active" | "inactive";
  user_is_active: boolean;
  profile_name: string;
}
