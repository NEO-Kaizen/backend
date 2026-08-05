import { Router } from 'express'
import { RequestsService } from './services/RequestsService'
import { RequestsController } from './controllers/RequestsController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const requestsService = new RequestsService()
const controller = new RequestsController(requestsService)

router.use(authMiddleware)

router.post('/', controller.create.bind(controller))
router.get('/', controller.list.bind(controller))
router.get('/:protocol', controller.findByProtocol.bind(controller))
router.put('/:protocol', controller.update.bind(controller))

export { router as requestsRoutes }
