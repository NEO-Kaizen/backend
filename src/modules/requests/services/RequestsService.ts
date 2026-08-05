export class RequestsService {
  async create(data: any): Promise<any> {
    // TODO: Validar dados da solicitação (campos obrigatórios do formulário)
    // TODO: Gerar protocolo único (ex: NEO-2026-000123)
    // TODO: Persistir no repositório com status inicial (ex: AGUARDANDO_TRIAGEM)
    // TODO: Inserir automaticamente na fila do NEO
    // TODO: Retornar { protocol, request }
  }

  async list(filters: any): Promise<any> {
    // TODO: Aplicar filtros (status, prioridade, categoria, bairro, busca textual)
    // TODO: Paginar resultados (page, limit)
    // TODO: Retornar { requests, total, page, totalPages }
  }

  async findByProtocol(protocol: string, query: any): Promise<any> {
    // TODO: Buscar solicitação por protocolo no repositório
    // TODO: Se não encontrar, lançar AppError(404, 'Solicitação não encontrada')
    // TODO: Aplicar paginação/filtros do req.query
    // TODO: Retornar solicitação com dados completos
  }

  async update(protocol: string, data: any): Promise<any> {
    // TODO: Verificar se a solicitação existe
    // TODO: Atualizar dados no repositório
    // TODO: Retornar solicitação atualizada
  }
}
