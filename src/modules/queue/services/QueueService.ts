export class QueueService {
  async list(query: any): Promise<any> {
    // TODO: Buscar demandas na fila com filtros do req.query
    // TODO: Calcular total e paginação
    // TODO: Retornar { demands, total, page, totalPages }
  }

  async getIndicators(query: any): Promise<any> {
    // TODO: Calcular indicadores da fila (tempo de espera, volume, distribuição)
    // TODO: Retornar indicadores agregados
  }
}
