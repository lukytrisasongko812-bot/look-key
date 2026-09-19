import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'rise_corporate_secure_secret_key_2026'

export interface TokenPayload {
  userId: string
  email: string
  role: string
  employeeName: string
  division?: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const verified = verifyToken(token)
    if (verified) return verified
  }
  const tokenParam = request.nextUrl.searchParams.get('token')
  if (tokenParam) {
    return verifyToken(tokenParam)
  }
  const cookieToken = request.cookies.get('ride_token')?.value || request.cookies.get('rise_token')?.value
  if (cookieToken) {
    return verifyToken(cookieToken)
  }
  return null
}
