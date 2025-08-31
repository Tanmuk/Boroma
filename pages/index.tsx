import Hero from '@/components/Hero'
import Link from 'next/link'
import { ISSUES } from '@/data/issues'

export default function Home(){
  const phone = process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100'
  return (
    <main>
      <div className="bg-white/60 text-center text-xs py-2 text-slate-600">First call free (10 min cap). No passwords or one-time codes—ever.</div>
      <Hero />
      <section className="container pt-16 pb-6">
        <h2>What we solve</h2>
        <p className="text-slate-600 mt-2">We cover most everyday issues. Here are the popular ones:</p>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {ISSUES.map(i => (
            <Link key={i.slug} href={`/what-we-solve/${i.slug}`} className="card p-5 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">{i.title}</div>
              <div className="text-sm text-slate-500">{i.short}</div>
            </Link>
          ))}
        </div>
      </section>
      <section className="container py-16">
        <div className="card p-8 text-center">
          <h2>Ready to feel confident with your tech?</h2>
          <p className="text-slate-600 mt-2">Talk to a patient expert now. First call is free for 10 minutes.</p>
          <div className="mt-6"><a href={`tel:${phone}`} className="btn btn-primary">Call {phone}</a></div>
        </div>
      </section>
    </main>
  )
}
