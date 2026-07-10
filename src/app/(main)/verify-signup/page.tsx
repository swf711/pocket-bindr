import { PageContainer } from '@/components/layout/page-container'
import { VerifySignupClient } from './verify-signup-client'

interface VerifySignupPageProps {
  searchParams: Promise<{ token?: string }>
}

// 與 /verify-email 不同：註冊者點驗證連結時通常尚未登入（換裝置/隔天才點），
// 故本頁刻意不加登入 guard（D4，見 CLAUDE.md）。POST /api/auth/verify-signup 本身也免登入。
export default async function VerifySignupPage({ searchParams }: VerifySignupPageProps) {
  const { token } = await searchParams

  return (
    <PageContainer>
      <div className="w-full max-w-md mx-auto">
        <VerifySignupClient token={token} />
      </div>
    </PageContainer>
  )
}
