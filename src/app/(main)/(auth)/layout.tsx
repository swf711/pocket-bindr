import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session) redirect('/cards')
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6">
      {children}
    </div>
  )
}
