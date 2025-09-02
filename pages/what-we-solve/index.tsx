import Link from 'next/link'
import { ISSUES } from '@/data/issues'

export default function Solve(){
  return (
    <main className="container py-16 text-center">
      <div className="section-label">What we solve</div>
      <h1 className="mt-2">We cover most everyday issues, here are the popular ones</h1>
      <p className="text-slate-600 mt-3">Click through for quick guides and what a typical call includes</p>
      <div className="mt-6 grid md:grid-cols-3 gap-6 text-left">
        {ISSUES.map(i => (
          <Link key={i.slug} href={`/what-we-solve/${i.slug}`} className="card p-5 hover:bg-slate-50">
            <div className="font-semibold text-slate-900">{i.title}</div>
            <div className="text-sm text-slate-500">{i.short}</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
