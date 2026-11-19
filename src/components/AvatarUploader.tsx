'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setAvatarUrl } from '@/lib/actions/profile'
import Avatar from '@/components/Avatar'

const SIZE = 400

// Center-crops to a square and shrinks, so uploads stay tiny no matter how
// large the original photo is.
async function resizeToSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE
  )
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process image'))),
      'image/jpeg',
      0.85
    )
  )
}

export default function AvatarUploader({
  userId,
  name,
  url,
}: {
  userId: string
  name: string
  url: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    startTransition(async () => {
      try {
        const blob = await resizeToSquareJpeg(file)
        const supabase = createClient()
        // A new file name each time so browsers never show a stale cached photo.
        const path = `${userId}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
        if (uploadError) throw new Error(uploadError.message)

        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        const result = await setAvatarUrl(data.publicUrl)
        if (result?.error) throw new Error(result.error)
      } catch (e) {
        setError(
          e instanceof Error && e.message
            ? `Couldn't use that image: ${e.message}`
            : "Couldn't use that image. Try a JPEG or PNG."
        )
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  return (
    <div className="flex items-center gap-5">
      <Avatar name={name} url={url} size={24} showTooltip={false} />
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          id="avatar-file"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
            className="btn btn-secondary"
          >
            {isPending ? 'Uploading…' : url ? 'Change photo' : 'Upload a photo'}
          </button>
          {url && (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await setAvatarUrl(null)
                  setError(result?.error ?? null)
                })
              }
              className="btn btn-ghost"
            >
              Remove
            </button>
          )}
        </div>
        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : (
          <p className="hint mt-0">Any photo works — it&apos;s cropped to a square for you.</p>
        )}
      </div>
    </div>
  )
}
