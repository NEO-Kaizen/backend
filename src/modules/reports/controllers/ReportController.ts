import { Request, Response, NextFunction } from 'express'
import { ReportService } from '../services/ReportService'

export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Extrair filtros do req.query (periodo, setor, bairro)
      // TODO: Chamar ReportService.dashboard(filters)
      // TODO: Retornar res.json(indicators)
    } catch (error) {
      next(error)
    }
  }

  async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Extrair filtros e formato (csv/excel) do req.query
      // TODO: Chamar ReportService.buildExportFile(filters, format)
      // TODO: Configurar headers de download e enviar arquivo
      // TODO: Retornar res.download(filePath) ou res.send(fileBuffer)
    } catch (error) {
      next(error)
    }
  }
}
