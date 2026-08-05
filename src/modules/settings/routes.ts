import { Router } from 'express'
import { SettingsService } from './services/SettingsService'
import { SettingsController } from './controllers/SettingsController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const settingsService = new SettingsService()
const controller = new SettingsController(settingsService)

router.use(authMiddleware)

router.get('/categories', controller.listCategories.bind(controller))
router.get('/categories/active', controller.listActive.bind(controller))
router.post('/categories', controller.createCategory.bind(controller))
router.get('/templates', controller.listTemplates.bind(controller))

export { router as settingsRoutes }
