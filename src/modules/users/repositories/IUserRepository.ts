import { User, CreateUserDTO, UpdateUserDTO } from '../types'

export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: CreateUserDTO): Promise<User>
  update(id: string, data: UpdateUserDTO): Promise<User | null>
  delete(id: string): Promise<boolean>
}
