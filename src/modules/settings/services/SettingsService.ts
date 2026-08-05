export class SettingsService {
  async getCategories(query: any): Promise<any> {
    // TODO: Buscar categorias configuradas com paginação/filtros
    // TODO: Suportar filtro active (ex.: ?active=true) para formulário público
    // TODO: Retornar lista de categorias
  }

  async createCategory(data: any): Promise<any> {
    // TODO: Validar dados da categoria (nome, ícone, ativa)
    // TODO: Persistir no repositório
    // TODO: Retornar categoria criada
  }

  async getTemplates(): Promise<any> {
    // TODO: Buscar templates de resposta configurados
    // TODO: Retornar lista de templates
  }
}
