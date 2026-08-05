export class TriageService {
  async changeStatus(protocol: string, status: string): Promise<any> {
    // TODO: Validar se o status é uma transição válida (ex: AGUARDANDO_TRIAGEM -> EM_TRIAGEM)
    // TODO: Atualizar status no repositório e registrar histórico
    // TODO: Retornar triage atualizado
  }

  async updateEligibility(protocol: string, eligibility: any): Promise<any> {
    // TODO: Validar elegibilidade (critérios de enquadramento)
    // TODO: Persistir elegibilidade no repositório
    // TODO: Retornar triage atualizado
  }
}
