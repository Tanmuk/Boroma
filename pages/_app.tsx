import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { inter } from '@/components/Fonts'
export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.className}>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  )
}
