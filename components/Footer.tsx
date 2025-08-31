import Link from 'next/link'
export default function Footer(){
  return (
    <footer className="mt-16 border-t border-slate-200">
      <div className="container py-10 text-sm text-slate-600 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="font-semibold text-slate-900">Boroma</div>
          <div>On-demand, phone-first tech support for seniors.</div>
        </div>
        <div className="flex gap-6">
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/fair-use">Fair Use</Link>
          <Link href="/legal/accessibility">Accessibility</Link>
        </div>
      </div>
    </footer>
  )
}
