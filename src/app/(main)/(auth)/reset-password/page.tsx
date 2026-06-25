import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from './reset-password-form'

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await auth()
  if (session) redirect('/settings')

  const { token } = await searchParams

  return (
    <div className="w-full max-w-md">
      <ResetPasswordForm token={token} />
    </div>
  )
}
