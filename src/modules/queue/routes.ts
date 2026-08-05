import { Router } from 'express'
import { QueueService } from './services/QueueService'
import { QueueController } from './controllers/QueueController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const queueService = new QueueService()
const controller = new QueueController(queueService)

router.use(authMiddleware)

router.get('/', controller.list.bind(controller))
router.get('/indicators', controller.indicators.bind(controller))

export { router as queueRoutes }
