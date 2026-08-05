import { Request, Response, NextFunction } from 'express'
import { RequestsService } from '../services/RequestsService'

export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Extrair dados da solicitação do req.body
      // TODO: Chamar RequestsService.create(data)
      // TODO: Retornar res.status(201).json({ protocol, request })
    } catch (error) {
      next(error)
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Extrair filtros do req.query (status, prioridade, categoria, busca, page, limit)
      // TODO: Chamar RequestsService.list(filters)
      // TODO: Retornar res.json({ requests, total, page, totalPages })
    } catch (error) {
      next(error)
    }
  }

  async findByProtocol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair filtros de paginação do req.query
      // TODO: Chamar RequestsService.findByProtocol(protocol, req.query)
      // TODO: Retornar res.json(request)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const protocol = req.params.protocol as string
      // TODO: Extrair dados de atualização do req.body
      // TODO: Chamar RequestsService.update(protocol, data)
      // TODO: Retornar res.json(request)
    } catch (error) {
      next(error)
    }
  }
}
