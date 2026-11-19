import type { Metadata } from 'next'
import LoginForm from '@/components/LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-semibold text-stone-900">Book Club</h1>
          <p className="mt-2 text-sm text-stone-500">
            What we&apos;re reading, and what we thought of it.
          </p>
        </div>
        <div className="card p-6 sm:p-8">
          <LoginForm
            initialError={
              error === 'auth'
                ? 'That sign-in link has expired or was already used. Request a new one below.'
                : undefined
            }
          />
        </div>
        <p className="mt-4 text-center text-xs text-stone-400">
          Invite-only. Ask a member if you need access.
        </p>
      </div>
    </div>
  )
}
