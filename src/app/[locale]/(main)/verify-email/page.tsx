import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/layout/page-container'
import { VerifyEmailClient } from './verify-email-client'

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>
}

// Unlike /reset-password ((auth) route group, which redirects logged-in
// users away), this page requires the user to already be logged in — the
// verify endpoint checks session.user.id against the token's userId (defense
// in depth, see CLAUDE.md). So this page lives under (main) with its own
// guard instead of (auth).
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { token } = await searchParams

  return (
    <PageContainer>
      <div className="w-full max-w-md mx-auto">
        <VerifyEmailClient token={token} />
      </div>
    </PageContainer>
  )
}
