import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/UserService'

export class UserController {
  constructor(private readonly userService: UserService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.create(req.body)
      res.status(201).json(user)
    } catch (error) {
      next(error)
    }
  }

  async findAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await this.userService.findAll()
      res.json(users)
    } catch (error) {
      next(error)
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      const user = await this.userService.findById(id)
      res.json(user)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      const user = await this.userService.update(id, req.body)
      res.json(user)
    } catch (error) {
      next(error)
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      // TODO: Extrair dados de perfil do req.body
      // TODO: Chamar UserService.updateProfile(id, data)
      // TODO: Retornar res.json(profile)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      await this.userService.delete(id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
