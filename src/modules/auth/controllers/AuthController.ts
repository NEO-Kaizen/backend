import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/AuthService'

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body
      const result = await this.authService.login({ email, password })
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body
      const result = await this.authService.register({ name, email, password })
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }
}
