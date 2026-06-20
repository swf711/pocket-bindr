export interface UserSettingsData {
  username: string | null
  email: string
  hasPassword: boolean
  isGoogleLinked: boolean
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
