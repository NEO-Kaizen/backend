import { Router } from 'express'
import { InMemoryUserRepository } from './repositories/InMemoryUserRepository'
import { UserService } from './services/UserService'
import { UserController } from './controllers/UserController'
import { authMiddleware } from '../../shared/middleware/auth'

const router = Router()

const repository = new InMemoryUserRepository()
const service = new UserService(repository)
const controller = new UserController(service)

router.use(authMiddleware)

router.post('/', controller.create.bind(controller))
router.get('/', controller.findAll.bind(controller))
router.get('/:id', controller.findById.bind(controller))
router.put('/:id', controller.update.bind(controller))
router.put('/:id/profile', controller.updateProfile.bind(controller))
router.delete('/:id', controller.delete.bind(controller))

export { router as userRoutes }
