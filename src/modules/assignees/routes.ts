import { Router } from 'express'
import { AssigneesService } from './services/AssigneesService'
import { AssigneesController } from './controllers/AssigneesController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const assigneesService = new AssigneesService()
const controller = new AssigneesController(assigneesService)

router.use(authMiddleware)

router.post('/:protocol/assign', controller.assign.bind(controller))
router.get('/:protocol/history', controller.history.bind(controller))

export { router as assigneesRoutes }
