import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { phCapture } from '@/lib/posthog'
import { FREE_TRY_NUMBER } from '@/lib/env.client'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const navClick = (label: string) => () => phCapture('nav_link_click', { label })

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-slate-100">
      <div className="mx-auto container px-4 h-14 flex items-center justify-between">
        <Link href="/" aria-label="Boroma home" onClick={navClick('Home')}>
          <Image src="/logo.svg" alt="Boroma" width={92} height={20} priority />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="/what-we-solve" onClick={navClick('What we solve')} className="hover:text-slate-900 text-slate-700">What we solve</a>
          <a href="#how-it-works" onClick={navClick('How it works')} className="hover:text-slate-900 text-slate-700">How it works</a>
          <a href="/pricing" onClick={navClick('Pricing')} className="hover:text-slate-900 text-slate-700">Pricing</a>
          <a href="/dashboard" onClick={navClick('Dashboard')} className="hover:text-slate-900 text-slate-700">Dashboard</a>

          <a
            href={`tel:${FREE_TRY_NUMBER}`}
            onClick={navClick('Try free call')}
            className="rounded-full border border-[#FF5B04]/30 px-4 py-2 text-[#FF5B04] hover:bg-[#FFEDD9]"
          >
            Try a call for free
          </a>
        </nav>

        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200"
          onClick={() => setOpen(!open)}
          aria-label="Open menu"
        >
          <span className="i-lucide-menu" />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-2">
            <a href="/what-we-solve" onClick={navClick('What we solve (mobile)')}>What we solve</a>
            <a href="#how-it-works" onClick={navClick('How it works (mobile)')}>How it works</a>
            <a href="/pricing" onClick={navClick('Pricing (mobile)')}>Pricing</a>
            <a href="/dashboard" onClick={navClick('Dashboard (mobile)')}>Dashboard</a>
            <a href={`tel:${FREE_TRY_NUMBER}`} onClick={navClick('Try free call (mobile)')}>Try a call for free</a>
          </div>
        </div>
      )}
    </header>
  )
}
