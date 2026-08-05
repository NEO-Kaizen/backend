import { Request, Response, NextFunction } from 'express'
import { SettingsService } from '../services/SettingsService'

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Extrair filtros de paginação/active do req.query
      // TODO: Chamar SettingsService.getCategories(req.query)
      // TODO: Retornar res.json(categories)
    } catch (error) {
      next(error)
    }
  }

  async listActive(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Chamar SettingsService.getCategories({ active: true })
      // TODO: Retornar res.json(categories) — (id, nome, icone, ativa)
    } catch (error) {
      next(error)
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Extrair dados da categoria do req.body
      // TODO: Chamar SettingsService.createCategory(data)
      // TODO: Retornar res.status(201).json(category)
    } catch (error) {
      next(error)
    }
  }

  async listTemplates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Chamar SettingsService.getTemplates()
      // TODO: Retornar res.json(templates)
    } catch (error) {
      next(error)
    }
  }
}
