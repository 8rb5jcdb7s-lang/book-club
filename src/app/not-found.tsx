import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="page-title mt-2">This page is missing from the shelf</h1>
      <p className="mt-2 max-w-sm text-sm text-stone-500">
        The book or page you&apos;re looking for doesn&apos;t exist, or it was removed.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to the club
      </Link>
    </div>
  )
}
