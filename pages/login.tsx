// Temporary redirect to the new slug /signin so old links don't break.
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LegacyLoginRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/signin')
  }, [router])
  return null
}
