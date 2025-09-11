// pages/_app.tsx
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { inter } from '@/components/Fonts'

export default function App({ Component, pageProps }: AppProps & { pageProps: any }) {
  // one client for the whole app
  const [supabase] = useState(() => createBrowserSupabaseClient())

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
