'use client'

import { useActionState } from 'react'
import { loginWithPassword, sendMagicLink } from './actions'

export default function LoginPage() {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    loginWithPassword,
    undefined
  )
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(
    sendMagicLink,
    undefined
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900">Book Club</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to continue</p>
        </div>

        <form action={passwordAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>
          {passwordState?.error && (
            <p className="text-sm text-red-600">{passwordState.error}</p>
          )}
          <button
            type="submit"
            disabled={passwordPending}
            className="w-full rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {passwordPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-stone-400">or</span>
          </div>
        </div>

        <form action={magicLinkAction} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="Email for magic link"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
          {magicLinkState?.error && (
            <p className="text-sm text-stone-600">{magicLinkState.error}</p>
          )}
          <button
            type="submit"
            disabled={magicLinkPending}
            className="w-full rounded-lg border-2 border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 shadow-sm hover:bg-stone-50 hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {magicLinkPending ? 'Sending...' : 'Email me a magic link'}
          </button>
        </form>
      </div>
    </div>
  )
}
