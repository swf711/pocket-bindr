import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/layout/page-container'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      email: true,
      image: true,
      passwordHash: true,
      accounts: { select: { provider: true } },
    },
  })

  if (!user) redirect('/login')

  return (
    <PageContainer>
      <SettingsClient
        username={user.username}
        email={user.email}
        image={user.image}
        hasPassword={user.passwordHash !== null}
        linkedProviders={user.accounts.map((a) => a.provider)}
      />
    </PageContainer>
  )
}
