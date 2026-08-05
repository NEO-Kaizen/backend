export class AssigneesService {
  async assign(protocol: string, data: any): Promise<any> {
    // TODO: Verificar se o responsável existe e está disponível
    // TODO: Atribuir responsável à demanda no repositório
    // TODO: Registrar histórico de atribuição
    // TODO: Retornar atribuição criada
  }

  async getHistory(protocol: string, query: any): Promise<any> {
    // TODO: Buscar histórico de atribuições por protocolo
    // TODO: Aplicar paginação/filtros do req.query
    // TODO: Retornar histórico
  }
}
