import { Router } from 'express'
import { AuditService } from './services/AuditService'
import { AuditController } from './controllers/AuditController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const auditService = new AuditService()
const controller = new AuditController(auditService)

router.use(authMiddleware)

router.get('/:protocol', controller.findByProtocol.bind(controller))

export { router as auditRoutes }
