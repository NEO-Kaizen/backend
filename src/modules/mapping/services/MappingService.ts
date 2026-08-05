export class MappingService {
  async schedule(protocol: string, data: any): Promise<any> {
    // TODO: Validar se a data de mapeamento é futura
    // TODO: Registrar agendamento no repositório
    // TODO: Retornar mapeamento criado
  }

  async updateMeeting(protocol: string, data: any): Promise<any> {
    // TODO: Verificar se o agendamento existe
    // TODO: Atualizar dados da reunião no repositório
    // TODO: Retornar mapeamento atualizado
  }
}
