import { compare, hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { AppError } from '../../../shared/errors/AppError'
import { IUserRepository } from '../../users/repositories/IUserRepository'
import { CreateUserDTO } from '../../users/types'
import { LoginDTO, AuthResponse } from '../types'

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async login(data: LoginDTO): Promise<AuthResponse> {
    
    const user = await this.userRepository.findByEmail(data.email)
    if (!user) throw new AppError('Invalid credentials', 401)
    
    const passwordMatch = await compare(data.password, user.password)
    if (!passwordMatch) throw new AppError('Invalid credentials', 401)
    
    const token = this.generateToken(user.id, user.email)

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    }
  }

  async register(data: CreateUserDTO): Promise<AuthResponse> {
    const existing = await this.userRepository.findByEmail(data.email)
    if (existing) throw new AppError('Email already in use', 409)

    const hashedPassword = await hash(data.password, 10)
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    })

    const token = this.generateToken(user.id, user.email)

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    }
  }

  private generateToken(id: string, email: string): string {
    return sign(
      { id, email },
      process.env.JWT_SECRET ?? 'default-secret',
      { expiresIn: '7d' },
    )
  }
}
