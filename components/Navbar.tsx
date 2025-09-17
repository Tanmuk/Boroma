import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { TRIAL_NUMBER } from '@/lib/env.client'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session?.user)
    })
    return () => sub.subscription?.unsubscribe?.()
  }, [])

  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="container mx-auto px-4 h-[64px] flex items-center justify-between">
        {/* Logo only (no text) */}
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Home">
            <Image src="/Boroma logo.svg" alt="Boroma" width={28} height={28} priority />
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/what-we-solve">What we solve</Link>
          <a href="/#how-it-works">How it works</a>
          <a href="/#pricing">Pricing</a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {!authed ? (
            <>
              <a href="/login" className="text-slate-700 hover:text-slate-900">Sign in</a>
              <a href="/#pricing" className="btn btn-primary">Get 24/7 support now</a>
              <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">Try a call for free</a>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-slate-700 hover:text-slate-900">Dashboard</Link>
              <a href="/#pricing" className="btn btn-primary">Get 24/7 support now</a>
              <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">Try a call for free</a>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-300"
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 grid gap-3">
            <Link href="/what-we-solve" onClick={() => setOpen(false)}>What we solve</Link>
            <a href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a>
            <a href="/#pricing" onClick={() => setOpen(false)}>Pricing</a>
          </div>
          <div className="px-4 py-3 grid gap-2">
            {!authed ? (
              <>
                <a href="/login" className="w-full text-left text-slate-700">Sign in</a>
                <a href="/#pricing" className="btn btn-primary w-full text-center">Get 24/7 support now</a>
                <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline w-full text-center">Try a call for free</a>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="w-full text-left text-slate-700" onClick={() => setOpen(false)}>Dashboard</Link>
                <a href="/#pricing" className="btn btn-primary w-full text-center">Get 24/7 support now</a>
                <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline w-full text-center">Try a call for free</a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
