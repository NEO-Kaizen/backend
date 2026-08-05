import { Request, Response, NextFunction } from 'express'
import { verify, JwtPayload } from 'jsonwebtoken'
import { AppError } from '../errors/AppError'

interface TokenPayload extends JwtPayload {
  id: string
  email: string
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    throw new AppError('Token not provided', 401)
  }

  const [, token] = authHeader.split(' ')

  try {
    const decoded = verify(
      token,
      process.env.JWT_SECRET ?? 'default-secret',
    ) as TokenPayload

    req.user = {
      id: decoded.id,
      email: decoded.email,
    }

    next()
  } catch {
    throw new AppError('Invalid token', 401)
  }
}
