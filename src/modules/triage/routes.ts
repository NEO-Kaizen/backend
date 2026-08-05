import { Router } from 'express'
import { TriageService } from './services/TriageService'
import { TriageController } from './controllers/TriageController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const triageService = new TriageService()
const controller = new TriageController(triageService)

router.use(authMiddleware)

router.put('/:protocol/status', controller.updateStatus.bind(controller))
router.put('/:protocol/eligibility', controller.updateEligibility.bind(controller))

export { router as triageRoutes }
