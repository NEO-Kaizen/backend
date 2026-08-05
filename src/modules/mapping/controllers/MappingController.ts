import { Request, Response, NextFunction } from 'express'
import { MappingService } from '../services/MappingService'

export class MappingController {
  constructor(private readonly mappingService: MappingService) {}

  async schedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair dados de agendamento do req.body (data, local)
      // TODO: Chamar MappingService.schedule(protocol, data)
      // TODO: Retornar res.status(201).json(mapping)
    } catch (error) {
      next(error)
    }
  }

  async updateMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair dados da reunião do req.body
      // TODO: Chamar MappingService.updateMeeting(protocol, data)
      // TODO: Retornar res.json(mapping)
    } catch (error) {
      next(error)
    }
  }
}
