import Link from 'next/link'

export default function Footer(){
  return (
    <footer className="mt-16 border-t border-slate-200">
      <div className="container py-10 text-sm text-slate-600 grid md:grid-cols-2 gap-6">
        <div>
          <div className="logo-type text-slate-900 text-lg">Boroma</div>
          <div>On demand, phone first tech support for seniors</div>
          <div className="mt-2 text-xs">© {new Date().getFullYear()} Boroma</div>
        </div>
        <div className="flex items-center md:justify-end gap-6 flex-wrap">
          <Link href="/what-we-solve">What we solve</Link>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
          <Link href="/blog">Blog</Link>
          <Link href="/legal/pledge">Scam-Free Pledge</Link>
          <Link href="/legal/terms">Terms of Service</Link>
          <Link href="/legal/privacy">Privacy Policy</Link>
          <a href="mailto:hello@boroma.site">Contact</a>
        </div>
      </div>
    </footer>
  )
}
