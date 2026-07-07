export type SupportedOAuthProvider = 'google' | 'discord'

export interface UserSettingsData {
  username: string | null
  email: string | null
  image: string | null
  hasPassword: boolean
  linkedProviders: string[]
}

export interface UpdateUsernameBody {
  username: string
}

export interface UpdatePasswordBody {
  currentPassword: string
  newPassword: string
}

export interface UpdateSuccessResponse {
  success: true
}

export interface UpdateErrorResponse {
  error: string
}
