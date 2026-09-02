import type { RoleCell } from "./role.ts";

export type RequestStatus =
    | "Solicitação enviada"
    | "Aguardando triagem"
    | "Em triagem"
    | "Pendente de informações"
    | "Aguardando mapeamento"
    | "Mapeamento agendado"
    | "Em mapeamento"
    | "Em análise de viabilidade"
    | "Elegível"
    | "Não elegível"
    | "Priorizado"
    | "Backlog"
    | "Direcionado para outra área"
    | "Em desenvolvimento"
    | "Em homologação"
    | "Concluído"
    | "Cancelado";

export type RequestPriority = "Baixa" | "Média" | "Alta" | "Crítica";

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
    fileName: string;      // nome original do arquivo — máx. 255
    mimeType: string;      // PDF, DOCX, XLSX, PNG ou JPG
    sizeBytes: number;     // máximo 10 * 1024 * 1024 (10MB)
}

export interface RequesterBlock {
    fullName: string;            // obrigatório — máx. 150
    corporateEmail: string;      // obrigatório — e-mail corporativo, máx. 254 (RFC 5321)
    area: string;                // obrigatório — máx. 100
    department?: string;         // opcional (padrão; Admin pode tornar obrigatório) — máx. 100
    // renderização híbrida: <Select> se houver departamentos
    // cadastrados; texto livre caso contrário (§1.1)
    manager: string;             // obrigatório — gestor responsável, máx. 150
    additionalContact?: string;  // opcional — telefone, ramal ou e-mail secundário, máx. 100
};

export interface DemandBlock {
    title: string;               // obrigatório — título resumido, máx. 150
    requestType: string;         // obrigatório — Tipo de Solicitação (modalidade macro,
    // ex.: Automação, Manutenção, Nova Demanda), máx. 80
    category: RequestCategory;   // obrigatório — Categoria da Demanda (select funcional), máx. 80
    processName: string;         // obrigatório — nome formal do processo atual, máx. 150
    description: string;         // obrigatório — Descrição da Necessidade, máx. 4.000
    problem: string;             // obrigatório — Problema ou Oportunidade Identificada, máx. 4.000
    expectedResult: string;      // obrigatório — Resultado Esperado, máx. 4.000
    justification: string;       // obrigatório — Justificativa da Solicitação, máx. 4.000
};

export interface OperationalBlock {
    processDescription: string;            // 1 — descrição resumida do processo atual, máx. 4.000
    processSteps: string;                  // 2 — principais etapas em tópicos/passo a passo, máx. 4.000
    systemsUsed: string;                   // 3 — softwares, ERPs, planilhas envolvidos, máx. 255
    executionFrequency: string;            // 4 — Diária, Semanal, Mensal, Por Demanda etc., máx. 50
    volumetry: string;                     // 5 — ex.: "500 transações/mês", máx. 100
    peopleInvolved: number;                // 6 — headcount alocado (INTEGER > 0)
    averageExecutionTime: string;          // 7 — tempo médio por ciclo, ex.: "15 minutos", máx. 60
    monthlyEffortHours: number;            // 8 — esforço mensal estimado em horas (DECIMAL(10,2))
    hasManualControls: YesNoDetail;        // 9 — controles manuais: false ou texto do
    //      detalhamento (obrigatório junto do "Sim")
    mainRisks: string;                     // 10 — riscos de erro/compliance/operacionais, máx. 2.000
    clientImpact: string;                  // 11 — reflexo no cliente interno/externo, máx. 2.000
    operationalImpact: OperationalImpact;  // 12 — Baixo/Médio/Alto/Crítico
    desiredDeadline: string;               // 13 — prazo desejado, data ISO "yyyy-mm-dd"
    perceivedCriticality: RequestPriority; // 14 — criticidade percebida pelo solicitante
}

export interface ComplementaryBlock {
    hasProcessDocumentation?: YesNoDetail; // existência de documentação do processo (+ links)
    hasSimilarSolution?: YesNoDetail;      // existência de solução semelhante
    dependsOnOtherAreas?: YesNoDetail;     // dependência de outras áreas (+ quais)
    handlesRestrictedInfo?: YesNoDetail;   // tratamento de informações restritas (LGPD/sigilo)
    additionalNotes?: string;              // observações adicionais, máx. 2.000
}

export type SchedulePreferences = string[]; // ISO "yyyy-mm-ddThh:mm" — max 3


export interface RequesterTable extends RequesterBlock {
    id: number;
    role: RoleCell;
    createdAt: Date;
    updatedAt: Date;
}


export const requestCategoryMAP: Record<number, RequestCategory> = {
    1: "Automação",
    2: "Melhoria de processo",
    3: "Indicador",
    4: "Dashboard ou relatório",
    5: "Análise de dados",
    6: "Padronização",
    7: "Revisão de processo",
    8: "Apoio técnico",
    9: "Estudo de viabilidade",
    10: "Outros",
};

export const requestCategoryToIdMAP = Object.fromEntries(
  Object.entries(requestCategoryMAP).map(([id, label]) => [label, Number(id)])
) as Record<RequestCategory, number>;