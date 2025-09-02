import Hero from '@/components/Hero'
import Link from 'next/link'
import Image from 'next/image'
import { ISSUES } from '@/data/issues'
import { useState } from 'react'

export default function Home(){
  const [annual, setAnnual] = useState(false)
  const priceMonthly = 29
  const priceAnnual = 243

  return (
    <main>
      {/* 1) HERO */}
      <Hero />

      {/* 2) THE PROBLEM, add extra top padding because hero image overhangs */}
      <section id="problem" className="container pt-28 pb-16 text-center">
        <div className="section-label">The problem</div>
        <h2 className="mt-2">Seniors need help their way, today’s tools were not built for them</h2>
        <p className="text-slate-600 mt-3 max-w-3xl mx-auto">
          Hold music, confusing apps, language barriers, and pushy support that asks for passwords or OTP codes,
          families want patient phone first help that fixes the issue safely in one call
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6 text-left">
          <div className="card p-6">
            <h3>Phone waits and holds</h3>
            <p className="text-slate-600 mt-2">Help should be instant, not 45 minutes later or between 4-6 pm</p>
          </div>
          <div className="card p-6">
            <h3>App installs and remote control</h3>
            <p className="text-slate-600 mt-2">We avoid screensharing and apps completely</p>
          </div>
          <div className="card p-6">
            <h3>Safety worries</h3>
            <p className="text-slate-600 mt-2">Scams thrive on confusion, we never take OTP codes or passwords</p>
          </div>
        </div>
      </section>

      {/* 3) OUR SOLUTION */}
      <section id="solution" className="container py-16 text-center">
        <div className="section-label">Our solution</div>
        <h2 className="mt-2">Phone first, scam aware, multilingual, fixed in one call</h2>
        <p className="text-slate-600 mt-3 max-w-3xl mx-auto">
          Patient agents, clear boundaries, we can switch languages mid sentence, and we text a simple recap after each call
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6 text-left">
          <div className="card p-6"><h3>Instant pickup</h3><p className="text-slate-600 mt-2">No waiting time, Our AI agents answer any time</p></div>
          <div className="card p-6"><h3>Scam aware coaching</h3><p className="text-slate-600 mt-2">We teach red flags and safe habits</p></div>
          <div className="card p-6"><h3>SMS recap</h3><p className="text-slate-600 mt-2">Clear step by step pictures after the call</p></div>
        </div>
      </section>

      {/* 4) HOW IT WORKS, two columns */}
      <section id="how-it-works" className="container py-16">
        <div className="section-label text-center">How it works</div>
        <h2 className="mt-2 text-center">Simpler than calling grandchildren, no apps, no logins</h2>
        <div className="grid md:grid-cols-2 gap-8 mt-6 items-center">
          <div className="space-y-4">
            <div className="card p-6">
              <h3>Call us</h3>
              <p className="text-slate-600 mt-2">Say the problem in clear words, in English, Spanish, or Chinese</p>
            </div>
            <div className="card p-6">
              <h3>We guide at your pace</h3>
              <p className="text-slate-600 mt-2">Patient step by step help, no screensharing</p>
            </div>
            <div className="card p-6">
              <h3>We text the recap</h3>
              <p className="text-slate-600 mt-2">Call summary delivered after call for monitoring</p>
            </div>
          </div>
          <div className="relative">
            <Image src="/howitworks.avif" alt="Kind support for seniors" width={800} height={600}
              className="rounded-2xl border border-slate-200 object-cover w-full h-[360px]" />
          </div>
        </div>
      </section>

      {/* 5) WHAT WE SOLVE preview */}
      <section id="what-we-solve" className="container py-16 text-center">
        <div className="section-label">What we solve</div>
        <h2 className="mt-2">We cover most everyday issues, here are the popular ones</h2>
        <p className="text-slate-600 mt-3">Phone, Wi Fi, passwords, scams, app setup, photos, printers, and more</p>
        <div className="grid md:grid-cols-3 gap-6 mt-6 text-left">
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

      {/* 6) PRICING, centered, one card with toggle */}
      <section id="pricing" className="container py-16 text-center">
        <div className="section-label">Pricing</div>
        <h2 className="mt-2">Peace of mind for one fixed price, cancel anytime</h2>
        <div className="card p-8 mt-6 max-w-3xl mx-auto text-left">
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
              {annual ? `$${priceAnnual}` : `$${priceMonthly}`}<span className="text-base font-normal text-slate-500">{annual ? '/yr' : '/mo'}</span>
            </div>
          </div>

          {/* Features */}
          <ul className="mt-6 space-y-2 text-slate-700">
            <li>• 24/7 phone first tech help</li>
            <li>• Multilingual, English, Spanish, Chinese</li>
            <li>• Fridge magnet print</li>
            <li>• Step by step pictures guide</li>
            <li>• Scam aware guidance and guardrails</li>
            <li>• Works on any phone, no apps</li>
            <li>• Patient and kind agents all the way</li>
            <li>• SMS recaps you can follow later</li>
          </ul>

          <div className="mt-6 flex gap-3">
            <Link href="/signup" className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">Unlock unlimited support</Link>
          </div>
        </div>
      </section>

      {/* 7) FAQ, centered, plus new language and after purchase Q */}
      <section id="faq" className="container py-16 text-center">
        <div className="section-label">FAQ</div>
        <h2 className="mt-2">Common questions from families</h2>
        <Accordion
          items={[
            { q: 'What happens after I buy a plan', a: 'You get a phone number you can print, place it on the fridge or share it with your grandparent, they call and we pick up' },
            { q: 'Which languages can you support', a: 'English, Spanish, Chinese, agents can switch mid sentence' },
            { q: 'Do you control the device remotely', a: 'No, we keep it safe and simple, voice guided steps only' },
            { q: 'Will you ever ask for passwords or OTP codes', a: 'Never, this is a hard rule, we guide steps without taking codes or remote control' },
            { q: 'Which devices do you cover', a: 'iPhone, Android, iPad, Windows, Mac, Wi Fi routers, printers, and common smart home basics' },
            { q: 'How do I cancel', a: 'Anytime by login into your account and then click Manage Subscription, no emails or phone calls needed' },
          ]}
        />
      </section>

      {/* 8) FINAL CTA */}
      <section className="container py-16">
        <div className="card p-10 text-center">
          <h2>Make your first call free</h2>
          <p className="text-slate-600 mt-2">Try us with no commitment, we will fix the issue or guide the next steps</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">Unlock unlimited support</Link>
            <a href={`tel:${process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100'}`} className="btn btn-outline">
              Try a call for free
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

/* Accordion with plus, minus icons */
function Accordion({ items }:{ items:{q:string, a:string}[] }){
  return (
    <div className="mt-6 max-w-3xl mx-auto text-left">
      {items.map((it, idx) => <Row key={idx} {...it} />)}
    </div>
  )
}
import { useState as useS } from 'react'
function Row({ q, a }:{ q:string, a:string }){
  const [open, setOpen] = useS(false)
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
