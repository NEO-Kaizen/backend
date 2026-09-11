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

export type TriageResult =
  | "Elegível para avaliação"
  | "Pendente de informações"
  | "Fora do escopo"
  | "Direcionada para outra área"
  | "Duplicada"
  | "Cancelada"
  | "Backlog";
