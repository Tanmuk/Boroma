import Link from 'next/link'
import { useState } from 'react'

export default function Navbar(){
  const [open, setOpen] = useState(false)
  return (
    <header className="bg-transparent relative">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="logo-type text-xl md:text-2xl">Boroma</Link>

        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-700">
          <a href="/#how-it-works">How it works</a>
          <Link href="/what-we-solve">What we solve</Link>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
          <Link href="/login">Log in</Link>
        </nav>

        {/* Main CTA now scrolls to Pricing */}
        <div className="hidden md:flex">
          <a href="/#pricing" className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">
            Unlock unlimited support
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Open menu"
          className="md:hidden p-2 text-slate-700"
          onClick={()=>setOpen(v=>!v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {open && (
        <div className="mobile-panel">
          <a className="mobile-link" href="/#how-it-works" onClick={()=>setOpen(false)}>How it works</a>
          <Link className="mobile-link" href="/what-we-solve" onClick={()=>setOpen(false)}>What we solve</Link>
          <a className="mobile-link" href="/#pricing" onClick={()=>setOpen(false)}>Pricing</a>
          <a className="mobile-link" href="/#faq" onClick={()=>setOpen(false)}>FAQ</a>
          <Link className="mobile-link" href="/login" onClick={()=>setOpen(false)}>Log in</Link>
          <div className="px-4 py-3">
            <a href="/#pricing" className="btn btn-primary w-full text-center hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">
              Unlock unlimited support
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
