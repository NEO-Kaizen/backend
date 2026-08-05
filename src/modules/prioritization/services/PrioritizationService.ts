export class PrioritizationService {
  async getCriteria(): Promise<any> {
    // TODO: Buscar critérios de priorização configurados
    // TODO: Retornar lista de critérios (peso, impacto, urgência)
  }

  async updateScore(protocol: string, score: any): Promise<any> {
    // TODO: Aplicar regras de prioridade (urgência, impacto, prazo, reclamações)
    // TODO: Calcular nota final (ex: 0-100)
    // TODO: Persistir prioridade no repositório
    // TODO: Retornar { priority, factors }
  }
}
