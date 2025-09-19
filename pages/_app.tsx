// pages/_app.tsx
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { inter } from '@/components/Fonts'
import { initPostHog, phCapture } from '@/lib/posthog'

export default function App({ Component, pageProps }: AppProps & { pageProps: any }) {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  const router = useRouter()

  // Init PostHog once and wire Next.js pageviews
  useEffect(() => {
    initPostHog()
    phCapture('$pageview', { path: window.location.pathname + window.location.search })
    const onRoute = (url: string) => phCapture('$pageview', { path: url })
    router.events.on('routeChangeComplete', onRoute)
    return () => router.events.off('routeChangeComplete', onRoute)
  }, [router.events])

  return (
    <div className={inter.className}>
      <Head>
        <link rel="icon" href="/favicon.svg" />
        <title>Boroma – On-Demand Tech Help for Seniors</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </SessionContextProvider>
    </div>
  )
}
