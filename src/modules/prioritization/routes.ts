import { Router } from 'express'
import { PrioritizationService } from './services/PrioritizationService'
import { PrioritizationController } from './controllers/PrioritizationController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const prioritizationService = new PrioritizationService()
const controller = new PrioritizationController(prioritizationService)

router.use(authMiddleware)

router.get('/criteria', controller.listCriteria.bind(controller))
router.put('/:protocol/score', controller.updateScore.bind(controller))

export { router as prioritizationRoutes }
