import { Request, Response, NextFunction } from 'express'
import { TriageService } from '../services/TriageService'

export class TriageController {
  constructor(private readonly triageService: TriageService) {}

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair novo status do req.body
      // TODO: Chamar TriageService.changeStatus(protocol, status)
      // TODO: Retornar res.json(triage)
    } catch (error) {
      next(error)
    }
  }

  async updateEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair elegibilidade do req.body
      // TODO: Chamar TriageService.updateEligibility(protocol, eligibility)
      // TODO: Retornar res.json(triage)
    } catch (error) {
      next(error)
    }
  }
}
