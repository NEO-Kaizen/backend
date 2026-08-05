import { Router } from 'express'
import { InMemoryUserRepository } from '../users/repositories/InMemoryUserRepository'
import { AuthService } from './services/AuthService'
import { AuthController } from './controllers/AuthController'

const router = Router()

const userRepository = new InMemoryUserRepository()
const authService = new AuthService(userRepository)
const controller = new AuthController(authService)

router.post('/register', controller.register.bind(controller))
router.post('/login', controller.login.bind(controller))

export { router as authRoutes }
