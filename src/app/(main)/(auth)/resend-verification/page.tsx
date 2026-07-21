import { ResendVerificationForm } from './resend-verification-form'

// 比照 forgot-password：需要重寄驗證信的使用者依定義尚未登入（credentials 登入被
// EmailNotVerifiedError 擋下），故放 (auth) route group，由其 layout 對已登入 session
// 導向 /cards，不需頁面層 guard。
export default function ResendVerificationPage() {
  return (
    <div className="w-full max-w-md">
      <ResendVerificationForm />
    </div>
  )
}
