import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

// Account pages have no search value; keep them out of the index but let crawlers follow links.
export const metadata: Metadata = { robots: { index: false, follow: true } }

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session) redirect('/cards')
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6">
      {children}
    </div>
  )
}
