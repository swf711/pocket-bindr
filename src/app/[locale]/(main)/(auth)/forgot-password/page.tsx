import { ForgotPasswordForm } from './forgot-password-form'

// Logged-in users are redirected away by the (auth) layout (→ /cards); no
// page-level session guard needed here.
export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <ForgotPasswordForm />
    </div>
  )
}
