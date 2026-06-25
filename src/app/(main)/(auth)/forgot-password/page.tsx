import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ForgotPasswordForm } from './forgot-password-form'

export default async function ForgotPasswordPage() {
  const session = await auth()
  if (session) redirect('/settings')

  return (
    <div className="w-full max-w-md">
      <ForgotPasswordForm />
    </div>
  )
}
