import { Router } from 'express'
import { ReportService } from './services/ReportService'
import { ReportController } from './controllers/ReportController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const reportService = new ReportService()
const controller = new ReportController(reportService)

router.use(authMiddleware)

router.get('/dashboard', controller.dashboard.bind(controller))
router.get('/export', controller.exportData.bind(controller))

export { router as reportsRoutes }
