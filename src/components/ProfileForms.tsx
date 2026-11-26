'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  changePassword,
  sendTestEmail,
  setEmailNotifications,
  updateDisplayName,
  type ProfileFormState,
  type TestEmailResult,
} from '@/lib/actions/profile'

function Status({ state, savedText }: { state: ProfileFormState; savedText: string }) {
  if (state?.error) return <p className="text-sm text-red-600">{state.error}</p>
  if (state?.saved) return <p className="text-sm font-medium text-emerald-700">{savedText}</p>
  return null
}

export function DisplayNameForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateDisplayName,
    undefined
  )

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="display_name" className="label">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={displayName}
          key={displayName}
          maxLength={40}
          required
          className="input max-w-xs"
        />
        <p className="hint">This is how you appear to the rest of the club.</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? 'Saving…' : 'Save name'}
        </button>
        <Status state={state} savedText="Saved ✓" />
      </div>
    </form>
  )
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    changePassword,
    undefined
  )

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid max-w-md gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="label">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Repeat it
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-secondary">
          {pending ? 'Saving…' : 'Set password'}
        </button>
        <Status state={state} savedText="Password updated ✓" />
      </div>
    </form>
  )
}

export function EmailToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={on}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.checked
            setOn(next)
            startTransition(async () => {
              const result = await setEmailNotifications(next)
              setError(result?.error ?? null)
              if (result?.error) setOn(!next)
            })
          }}
          className="mt-1 h-4 w-4 accent-stone-900"
        />
        <span>
          <span className="block text-sm font-medium text-stone-900">Email me club updates</span>
          <span className="block text-sm text-stone-500">
            Only three things: a new book starts, someone finishes the current book, or
            you&apos;re the last one who hasn&apos;t rated.
          </span>
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function TestEmailButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TestEmailResult | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => setResult(await sendTestEmail()))}
        className="btn btn-secondary btn-sm"
      >
        {isPending ? 'Sending…' : 'Send me a test email'}
      </button>
      {result && (
        <p
          role="status"
          className={`text-sm ${result.ok ? 'font-medium text-emerald-700' : 'text-red-600'}`}
        >
          {result.message}
        </p>
      )}
    </div>
  )
}
