export interface RegisterInput {
  email: string
  username: string
  password: string
}

export interface RegisterResult {
  success: boolean
  error?: 'EMAIL_TAKEN' | 'USERNAME_TAKEN' | 'INVALID_INPUT' | 'WEAK_PASSWORD'
  userId?: string
}

export interface LoginInput {
  email: string
  password: string
}
