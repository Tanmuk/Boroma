import type { AppProps } from 'next/app'
import Head from 'next/head'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { inter } from '@/components/Fonts'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.className}>
      <Head>
        <link rel="icon" href="/favicon.svg" />
        <title>Boroma – On-Demand Tech Help for Seniors</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  )
}
