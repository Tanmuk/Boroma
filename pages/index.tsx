import Hero from '@/components/Hero'
import Link from 'next/link'
import Image from 'next/image'
import { ISSUES } from '@/data/issues'
import { useState } from 'react'

export default function Home(){
  const [annual, setAnnual] = useState(false)
  const priceMonthly = 29
  const priceAnnual = 243 // 30% off

  return (
    <main>
      {/* 1) HERO */}
      <Hero />

      {/* 2) PROBLEM */}
      <section id="problem" className="container py-16">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">The problem</div>
        <h2 className="mt-2">Seniors need real help—today’s tools weren’t built for them</h2>
        <p className="text-slate-600 mt-3 max-w-3xl">
          Long wait times, confusing apps, language barriers, and pushy support that asks for passwords or OTPs.
          Families want patient, phone-first help that fixes the issue safely in one call.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="card p-6">
            <h3>Phone trees & hold music</h3>
            <p className="text-slate-600 mt-2">Help should be instant—not 45 minutes later.</p>
          </div>
          <div className="card p-6">
            <h3>Apps & remote-control hoops</h3>
            <p className="text-slate-600 mt-2">We avoid screen-sharing and apps entirely.</p>
          </div>
          <div className="card p-6">
            <h3>Safety concerns</h3>
            <p className="text-slate-600 mt-2">Scams thrive on confusion—OTP and passwords are off-limits.</p>
          </div>
        </div>
      </section>

      {/* 3) SOLUTION */}
      <section id="solution" className="container py-16">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Our solution</div>
        <h2 className="mt-2">Phone-first, scam-aware, multilingual help—fixed in one call</h2>
        <p className="text-slate-600 mt-3 max-w-3xl">
          We pair patient agents with clear boundaries: no OTPs or passwords, ever. We can switch languages mid-sentence,
          and we text a simple recap after each call.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="card p-6"><h3>Instant pickup</h3><p className="text-slate-600 mt-2">No waiting time—humans answer, 24/7.</p></div>
          <div className="card p-6"><h3>Scam-aware coaching</h3><p className="text-slate-600 mt-2">We teach red-flags & safe habits.</p></div>
          <div className="card p-6"><h3>SMS recap</h3><p className="text-slate-600 mt-2">Clear step-by-step pictures after the call.</p></div>
        </div>
      </section>

      {/* 4) HOW IT WORKS */}
      <section id="how-it-works" className="container py-16">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">How it works</div>
        <h2 className="mt-2">Three simple steps—no apps, no logins</h2>
        <div className="grid md:grid-cols-2 gap-8 mt-6 items-center">
          <div className="space-y-4">
            <div className="card p-6">
              <h3>1) Call us</h3>
              <p className="text-slate-600 mt-2">Say the problem in plain English (or another language).</p>
            </div>
            <div className="card p-6">
              <h3>2) We guide at your pace</h3>
              <p className="text-slate-600 mt-2">Patient, step-by-step help—no screensharing.</p>
            </div>
            <div className="card p-6">
              <h3>3) We text the recap</h3>
              <p className="text-slate-600 mt-2">Pictures and steps so your family can repeat later.</p>
            </div>
          </div>
          <div className="relative">
            <Image src="/howitworks.avif" alt="Kind support for seniors" width={800} height={600}
              className="rounded-2xl border border-slate-200 object-cover w-full h-[360px]" />
          </div>
        </div>
      </section>

      {/* 5) WHAT WE SOLVE (preview) */}
      <section id="what-we-solve" className="container py-16">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">What we solve</div>
        <h2 className="mt-2">We cover most everyday issues. Here are the popular ones:</h2>
        <p className="text-slate-600 mt-3">Phone, Wi-Fi, passwords, scams, app setup, photos, printers, and more.</p>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {ISSUES.slice(0,9).map(i => (
            <Link key={i.slug} href={`/what-we-solve/${i.slug}`} className="card p-5 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">{i.title}</div>
              <div className="text-sm text-slate-500">{i.short}</div>
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/what-we-solve" className="btn btn-outline">View more</Link>
        </div>
      </section>

      {/* 6) PRICING */}
      <section id="pricing" className="container py-16">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Pricing</div>
        <h2 className="mt-2">Simple, fair pricing—cancel anytime</h2>
        <div className="card p-8 mt-6 max-w-3xl">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={()=>setAnnual(false)}
                className={`px-3 py-1 rounded-full ${!annual ? 'bg-[#FFE6D6] text-[#A43C00]' : 'bg-slate-100 text-slate-600'}`}>
                Monthly
              </button>
              <button onClick={()=>setAnnual(true)}
                className={`px-3 py-1 rounded-full ${annual ? 'bg-[#FFE6D6] text-[#A43C00]' : 'bg-slate-100 text-slate-600'}`}>
                Annually
              </button>
            </div>
            <div className="text-sm text-[#A43C00]">Save 30% with Annually</div>
          </div>

          {/* Price */}
          <div className="mt-4">
            <div className="text-5xl font-semibold">
              {annual ? `$${priceAnnual}` : `$${priceMonthly}`}
              <span className="text-base font-normal text-slate-500">{annual ? '/yr' : '/mo'}</span>
            </div>
          </div>

          {/* Features */}
          <ul className="mt-6 space-y-2 text-slate-700">
            <li>• 24/7 phone-first tech help</li>
            <li>• Fridge magnet print</li>
            <li>• SMS step-by-step pictures</li>
            <li>• Scam-aware guidance & guardrails</li>
            <li>• Covers commons issues in any device</li>
            <li>• Multilingual</li>
            <li>• Works on any phone, no apps</li>
            <li>• Patient & Kind agents all the way</li>
            <li>• SMS recaps you can follow later</li>
          </ul>

          <div className="mt-6 flex gap-3">
            <Link href="/signup" className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">Start now</Link>
          </div>
        </div>
      </section>

      {/* 7) FAQ */}
      <section id="faq" className="container py-16">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">FAQ</div>
        <h2 className="mt-2">Common questions from families</h2>
        <Accordion
          items={[
            { q: 'Will you ever ask for passwords or OTP codes?', a: 'Never. It’s a hard rule. We guide steps without taking codes or remote control.' },
            { q: 'Do you support Spanish?', a: 'English at launch, Spanish next. Agents can switch languages mid-sentence.' },
            { q: 'Can you control the device remotely?', a: 'No. We keep it safe and simple: voice-guided steps only.' },
            { q: 'What if the problem takes longer?', a: 'Most issues finish in one call. We remind at 25 minutes and end at 35 minutes to keep lines open.' },
            { q: 'Which devices do you cover?', a: 'iPhone, Android, iPad, Windows, Mac, Wi-Fi routers, printers, and common smart-home basics.' },
            { q: 'How do I cancel?', a: 'Anytime via the Billing portal—no emails or phone calls needed.' },
          ]}
        />
      </section>

      {/* 8) FINAL CTA */}
      <section className="container py-16">
        <div className="card p-10 text-center">
          <h2>Make your first call free</h2>
          <p className="text-slate-600 mt-2">Try us with no commitment. We’ll fix the issue or guide the next steps.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">Start now</Link>
            <a href={`tel:${process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100'}`} className="btn btn-outline">
              Call now for free
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

/* Simple accordion (plus/minus icons) */
function Accordion({ items }:{ items:{q:string, a:string}[] }){
  return (
    <div className="mt-6 max-w-3xl">
      {items.map((it, idx) => <Row key={idx} {...it} />)}
    </div>
  )
}
function Row({ q, a }:{ q:string, a:string }){
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200 py-4">
      <button className="w-full flex items-center justify-between text-left" onClick={()=>setOpen(v=>!v)}>
        <span className="font-semibold">{q}</span>
        <span className="text-[#FF5B04] text-xl leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="text-slate-600 mt-2">{a}</p>}
    </div>
  )
}
