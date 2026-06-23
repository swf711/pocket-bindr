import { LoginForm } from '@/components/auth/login-form'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; account_deleted?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, account_deleted } = await searchParams
  return (
    <div className="w-full max-w-md">
      <LoginForm
        oauthError={error}
        accountDeleted={account_deleted === 'true'}
      />
    </div>
  )
}
