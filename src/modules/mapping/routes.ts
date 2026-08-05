import { Router } from 'express'
import { MappingService } from './services/MappingService'
import { MappingController } from './controllers/MappingController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const mappingService = new MappingService()
const controller = new MappingController(mappingService)

router.use(authMiddleware)

router.post('/:protocol/schedule', controller.schedule.bind(controller))
router.put('/:protocol/meeting', controller.updateMeeting.bind(controller))

export { router as mappingRoutes }
