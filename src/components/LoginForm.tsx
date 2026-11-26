'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/login/actions'

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, undefined)

  const error = state?.error ?? (state ? undefined : initialError)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.email ?? ''}
          required
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        name="intent"
        value="password"
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending ? 'Working…' : 'Sign in'}
      </button>

      <div className="flex items-center gap-3 text-xs text-stone-400">
        <div className="h-px flex-1 bg-stone-200" />
        or
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <button
        type="submit"
        name="intent"
        value="magic-link"
        disabled={pending}
        className="btn btn-secondary w-full"
      >
        Email me a sign-in link
      </button>
      <p className="hint text-center">No password needed — just enter your email above.</p>
    </form>
  )
}
