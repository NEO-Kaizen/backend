import { Request, Response, NextFunction } from 'express'
import { QueueService } from '../services/QueueService'

export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Extrair filtros de paginação do req.query (status, prioridade, categoria)
      // TODO: Chamar QueueService.list(query)
      // TODO: Retornar res.json({ demands, total, page, totalPages })
    } catch (error) {
      next(error)
    }
  }

  async indicators(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Extrair filtros do req.query (período, setor)
      // TODO: Chamar QueueService.getIndicators(query)
      // TODO: Retornar res.json(indicators)
    } catch (error) {
      next(error)
    }
  }
}
