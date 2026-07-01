import { ResetPasswordForm } from './reset-password-form'

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

// Logged-in users are redirected away by the (auth) layout (→ /cards); no
// page-level session guard needed here.
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams

  return (
    <div className="w-full max-w-md">
      <ResetPasswordForm token={token} />
    </div>
  )
}
