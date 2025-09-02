import Link from 'next/link'

export default function Navbar(){
  return (
    <header className="bg-transparent">
      <div className="container flex items-center justify-between h-16">
        {/* Pure logotype (no mark) */}
        <Link href="/" className="logo-type text-xl md:text-2xl">Boroma</Link>

        {/* Anchor links: all sections except What we solve (separate page) */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-700">
          <a href="/#problem">Problem</a>
          <a href="/#solution">Solution</a>
          <a href="/#how-it-works">How it works</a>
          <Link href="/what-we-solve">What we solve</Link>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
        </nav>

        {/* Main CTA only */}
        <div className="flex gap-2">
          <Link href="/signup" className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">Start now</Link>
        </div>
      </div>
    </header>
  )
}
