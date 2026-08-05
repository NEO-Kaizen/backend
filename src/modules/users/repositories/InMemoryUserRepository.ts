import { v4 as uuid } from 'uuid'
import { User, CreateUserDTO, UpdateUserDTO } from '../types'
import { IUserRepository } from './IUserRepository'

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map()

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values())
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user
      }
    }
    return null
  }

  async create(data: CreateUserDTO): Promise<User> {
    const now = new Date()
    const user: User = {
      id: uuid(),
      name: data.name,
      email: data.email,
      password: data.password,
      createdAt: now,
      updatedAt: now,
    }
    this.users.set(user.id, user)
    return user
  }

  async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    const user = this.users.get(id)
    if (!user) return null

    const updated: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    }
    this.users.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id)
  }
}
