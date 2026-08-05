import { Request, Response, NextFunction } from 'express'
import { PrioritizationService } from '../services/PrioritizationService'

export class PrioritizationController {
  constructor(private readonly prioritizationService: PrioritizationService) {}

  async listCriteria(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Chamar PrioritizationService.getCriteria()
      // TODO: Retornar res.json(criteria)
    } catch (error) {
      next(error)
    }
  }

  async updateScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair score e fatores do req.body
      // TODO: Chamar PrioritizationService.updateScore(protocol, score)
      // TODO: Retornar res.json({ priority })
    } catch (error) {
      next(error)
    }
  }
}
