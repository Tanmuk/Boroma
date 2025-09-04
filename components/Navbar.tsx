import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

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
    <header className="bg-transparent relative">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2" aria-label="Boroma home">
          <Image
            src="/Boroma logo.svg"
            alt="Boroma"
            width={80}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-700">
          <a href="/#how-it-works">How it works</a>
          <Link href="/what-we-solve">What we solve</Link>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
          {authed ? (
            <Link href="/dashboard">Dashboard</Link>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </nav>

        {/* Main CTA */}
        <div className="hidden md:flex">
          <a
            href="/#pricing"
            className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]"
          >
            Unlock on demand support
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Open menu"
          className="md:hidden p-2 text-slate-700"
          onClick={() => setOpen(v => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {open && (
        <div className="mobile-panel">
          <a className="mobile-link" href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a>
          <Link className="mobile-link" href="/what-we-solve" onClick={() => setOpen(false)}>What we solve</Link>
          <a className="mobile-link" href="/#pricing" onClick={() => setOpen(false)}>Pricing</a>
          <a className="mobile-link" href="/#faq" onClick={() => setOpen(false)}>FAQ</a>
          {authed ? (
            <Link className="mobile-link" href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
          ) : (
            <Link className="mobile-link" href="/login" onClick={() => setOpen(false)}>Sign in</Link>
          )}
          <div className="px-4 py-3">
            <a
              href="/#pricing"
              className="btn btn-primary w-full text-center hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]"
              onClick={() => setOpen(false)}
            >
              Unlock on demand support
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
