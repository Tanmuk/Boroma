import Link from 'next/link'
export default function Navbar(){
  return (
    <header className="bg-transparent">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-primary-400 to-primary-500 text-white grid place-content-center">
            <span className="text-sm font-bold">Bo</span>
          </div>
          <span className="text-xl font-semibold">Boroma</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-700">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/what-we-solve">What we solve</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="flex gap-2">
          <Link href="/login" className="btn btn-outline">Log in</Link>
          <a href={`tel:${process.env.NEXT_PUBLIC_PRIMARY_PHONE||'+1-555-0100'}`} className="btn btn-primary">Get Help</a>
        </div>
      </div>
    </header>
  )
}
