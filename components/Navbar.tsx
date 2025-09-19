import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import { phCapture } from '@/lib/posthog'

/**
 * Navbar layout (desktop):
 * ┌───────────────┬───────────────────────────────┬────────────────────┐
 * │   Logo (L)    │   Centered menu links (C)     │  Primary CTA (R)   │
 * └───────────────┴───────────────────────────────┴────────────────────┘
 * - Sticky + blur on scroll
 * - Signed-in users see "Dashboard" in the center menu; signed-out see "Sign in"
 * - Single primary CTA on the right: “Get 24/7 support now” -> scrolls to #pricing
 */

export default function Navbar() {
  const user = useUser()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleCTAClick = () => {
    phCapture('nav_primary_cta')
    if (typeof window !== 'undefined') {
      const el = document.querySelector('#pricing')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.location.href = '/pricing'
    }
  }

  const CenterLinks = () => (
    <>
      {/* EXACTLY as requested: this goes to a separate page */}
      <Link href="/whatwesolve" className="nav-link">
        What we solve
      </Link>

      {/* All other center items link to homepage sections */}
      <a href="#how-it-works" className="nav-link">
        How it works
      </a>
      <a href="#pricing" className="nav-link">
        Pricing
      </a>

      {user ? (
        <Link href="/dashboard" className="nav-link">
          Dashboard
        </Link>
      ) : (
        <Link href="/signin" className="nav-link">
          Sign in
        </Link>
      )}
    </>
  )

  return (
    <header
      className={[
        'sticky top-0 z-50 border-b border-slate-100',
        'backdrop-blur supports-[backdrop-filter]:bg-white/70',
        scrolled ? 'bg-white/70' : 'bg-white/50',
      ].join(' ')}
    >
      <div className="mx-auto container px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" aria-label="Boroma home" className="shrink-0 inline-flex items-center gap-2">
            {/* Space in filename encoded to avoid 404s */}
            <Image
              src="/Boroma%20logo.svg"
              alt="Boroma"
              width={108}
              height={24}
              priority
              className="h-6 w-auto"
            />
          </Link>

          {/* Center: Menu (desktop) */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
            <CenterLinks />
          </nav>

          {/* Right: Primary CTA (desktop) */}
          <div className="hidden md:block">
            <button
              onClick={handleCTAClick}
              className="rounded-full bg-gradient-to-r from-[#FF7A1A] to-[#FF5B04] text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-95 transition"
            >
              Get 24/7 support now
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white/90 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <CenterLinks />
            <button
              onClick={() => {
                setOpen(false)
                handleCTAClick()
              }}
              className="mt-2 rounded-full bg-gradient-to-r from-[#FF7A1A] to-[#FF5B04] text-white px-5 py-3 text-sm font-semibold shadow-sm"
            >
              Get 24/7 support now
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .nav-link {
          @apply text-slate-700 hover:text-slate-900 transition-colors text-sm font-medium;
        }
      `}</style>
    </header>
  )
}
