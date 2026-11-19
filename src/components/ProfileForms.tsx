'use client'

import { useActionState } from 'react'
import {
  changePassword,
  updateDisplayName,
  type ProfileFormState,
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
