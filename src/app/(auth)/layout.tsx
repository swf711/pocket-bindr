import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/layout/page-container'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session) redirect('/cards')
  return <PageContainer>{children}</PageContainer>
}
