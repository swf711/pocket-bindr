import { randomBytes } from 'crypto'

export function generateShareToken(): string {
  return randomBytes(16).toString('hex')
}
