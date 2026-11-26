import { headers } from 'next/headers'

/** The address the site is being served from, for links inside emails. */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) {
    return configured.replace(/\/$/, '')
  }

  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin')
  if (origin) return origin

  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : (configured ?? 'http://localhost:3000')
}
