import { hash } from 'bcryptjs'
import { AppError } from '../../../shared/errors/AppError'
import { IUserRepository } from '../repositories/IUserRepository'
import { CreateUserDTO, UpdateUserDTO, UserResponse } from '../types'

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async findAll(): Promise<UserResponse[]> {
    const users = await this.userRepository.findAll()
    return users.map(this.toResponse)
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id)
    if (!user) throw new AppError('User not found', 404)
    return this.toResponse(user)
  }

  async create(data: CreateUserDTO): Promise<UserResponse> {
    const existing = await this.userRepository.findByEmail(data.email)
    if (existing) throw new AppError('Email already in use', 409)

    const hashedPassword = await hash(data.password, 10)
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    })
    return this.toResponse(user)
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserResponse> {
    const user = await this.userRepository.findById(id)
    if (!user) throw new AppError('User not found', 404)

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email)
      if (existing) throw new AppError('Email already in use', 409)
    }

    if (data.password) {
      data.password = await hash(data.password, 10)
    }

    const updated = await this.userRepository.update(id, data)
    return this.toResponse(updated!)
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id)
    if (!deleted) throw new AppError('User not found', 404)
  }

  private toResponse(user: any): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
