import { Request, Response, NextFunction } from 'express'
import { AuditService } from '../services/AuditService'

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  async findByProtocol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair filtros de paginação do req.query
      // TODO: Chamar AuditService.findByProtocol(protocol, query)
      // TODO: Retornar res.json(auditLog)
    } catch (error) {
      next(error)
    }
  }
}
