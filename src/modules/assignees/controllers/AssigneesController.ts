import { Request, Response, NextFunction } from 'express'
import { AssigneesService } from '../services/AssigneesService'

export class AssigneesController {
  constructor(private readonly assigneesService: AssigneesService) {}

  async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair dados de atribuição do req.body (responsável, equipe)
      // TODO: Chamar AssigneesService.assign(protocol, data)
      // TODO: Retornar res.status(201).json(assignment)
    } catch (error) {
      next(error)
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair filtros de paginação do req.query
      // TODO: Chamar AssigneesService.getHistory(protocol, query)
      // TODO: Retornar res.json(history)
    } catch (error) {
      next(error)
    }
  }
}
