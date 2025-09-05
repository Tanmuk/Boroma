import Hero from '@/components/Hero'
import Link from 'next/link'
import Image from 'next/image'
import { ISSUES } from '@/data/issues'
import TrustPledge from '@/components/TrustPledge'
import { useState } from 'react'

export default function Home(){
  const [annual, setAnnual] = useState(false)
  const priceMonthly = 29
  const priceAnnual = 348

  return (
    <main>
      <Hero />

      {/* Problem */}
      <section id="problem" className="container py-16 text-center">
        <div className="section-label">The problem</div>
        <h2 className="mt-2">Seniors need real help, today’s tools were not built for them</h2>
        <p className="text-slate-600 mt-3 max-w-3xl mx-auto">
          Hold music, confusing apps, language barriers, and pushy support that asks for passwords or OTP codes,
          families want patient phone first help that fixes the issue safely in one call
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6 text-left">
          <div className="card p-6"><h3>Phone trees and long waits</h3><p className="text-slate-600 mt-2">Help should be instant, not after a long wait</p></div>
          <div className="card p-6"><h3>App installs and remote access</h3><p className="text-slate-600 mt-2">We avoid screensharing and apps completely</p></div>
          <div className="card p-6"><h3>Safety worries</h3><p className="text-slate-600 mt-2">Scams use confusion, we never take OTP codes or passwords</p></div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="container py-16 text-center">
        <div className="section-label">Our solution</div>
        <h2 className="mt-2">On demand, patient tech help that works over a simple phone call</h2>
        <p className="text-slate-600 mt-3 max-w-3xl mx-auto">
          We fix the common issues by phone step by step and send a written recap afterward. No apps, no screen sharing,
          clear boundaries and a toll free line for members.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6 text-left">
          <div className="card p-6"><h3>Phone first</h3><p className="text-slate-600 mt-2">Works on any phone, nothing to install</p></div>
          <div className="card p-6"><h3>Scam aware coaching</h3><p className="text-slate-600 mt-2">We teach safe habits and guardrails</p></div>
          <div className="card p-6"><h3>Post call recap</h3><p className="text-slate-600 mt-2">Step by step pictures by SMS so you can follow later</p></div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container py-16">
        <div className="section-label text-center">How it works</div>
        <h2 className="mt-2 text-center">Easier than calling your grandchildren</h2>
        <p className="text-slate-600 mt-3 max-w-3xl mx-auto text-center">
          Three quick steps to get help fast, no apps, no codes, just a phone call
        </p>
        <div className="grid md:grid-cols-2 gap-8 items-center mt-6">
          <div className="order-2 md:order-1">
            <ol className="space-y-4">
              <li className="card p-5">
                <h3>1, Choose a plan and create your account</h3>
                <p className="text-slate-600 mt-2">We give you your support number instantly</p>
              </li>
              <li className="card p-5">
                <h3>2, Add family members</h3>
                <p className="text-slate-600 mt-2">Only approved numbers can reach the toll free line</p>
              </li>
              <li className="card p-5">
                <h3>3, Call when you need help</h3>
                <p className="text-slate-600 mt-2">We fix the issue in one call and text a recap</p>
              </li>
            </ol>
          </div>
          <div className="order-1 md:order-2">
            <Image src="/howitworks.avif" alt="How it works" width={900} height={700} className="rounded-2xl w-full h-auto"/>
          </div>
        </div>
      </section>

      {/* What we solve summary */}
      <section id="what" className="container py-16 text-center">
        <div className="section-label">What we solve</div>
        <h2 className="mt-2">We cover most everyday issues, here are the popular ones</h2>
        <p className="text-slate-600 mt-3 max-w-3xl mx-auto">From Wi-Fi and passwords to scam checks and phone settings</p>
        <div className="grid md:grid-cols-3 gap-4 mt-6 text-left">
          {ISSUES.slice(0,9).map(item => (
            <div key={item.slug} className="card p-5">
              <h3>{item.title}</h3>
              <p className="text-slate-600 mt-2">{item.summary}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/what-we-solve" className="btn btn-outline">View more</Link>
        </div>
      </section>

      {/* Trust pledge */}
      <TrustPledge />

      {/* Pricing */}
      <section id="pricing" className="container py-16 text-center">
        <div className="section-label">Pricing</div>
        <h2 className="mt-2">Peace of mind for one fixed price</h2>
        <p className="text-slate-600 mt-2">Cancel anytime, this is our introductory price, price may change in the future</p>

        <div className="card p-8 mt-6 max-w-3xl mx-auto text-left">
          {/* Toggle */}
          <div className="flex items-center gap-3">
            <div className="font-semibold">Plan</div>
            <div
              role="tablist"
              aria-label="Billing period"
              className="ml-auto inline-flex rounded-full border border-slate-200 p-1 bg-white"
            >
              <button
                role="tab"
                aria-selected={!annual}
                className={`px-4 py-2 rounded-full text-sm font-medium ${!annual ? 'bg-[#FFEDD9] text-slate-900' : 'text-slate-600'}`}
                onClick={() => setAnnual(false)}
              >
                Monthly
              </button>
              <button
                role="tab"
                aria-selected={annual}
                className={`px-4 py-2 rounded-full text-sm font-medium ${annual ? 'bg-[#FFEDD9] text-slate-900' : 'text-slate-600'}`}
                onClick={() => setAnnual(true)}
              >
                Annually
              </button>
            </div>
          </div>

          {/* Price + features */}
          <div className="mt-4">
            <div className="text-4xl font-semibold">
              ${annual ? priceAnnual : priceMonthly}
              <span className="text-base font-normal text-slate-500">/{annual ? 'yr' : 'mo'}</span>
            </div>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>1, 24/7 phone first tech help</li>
              <li>2, 10 calls per month, each call up to 35 minutes</li>
              <li>3, Toll free number for paid members</li>
              <li>4, Fridge magnet print</li>
              <li>5, SMS step by step pictures</li>
              <li>6, Scam aware guidance and guardrails</li>
              <li>7, Covers common issues in any device</li>
              <li>8, Multilingual, English, Spanish, Chinese</li>
              <li>9, Works on any phone, no apps</li>
              <li>10, Patient and kind agents all the way</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link
                href={`/signup?plan=${annual ? 'annual' : 'monthly'}`}
                className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]"
              >
                Unlock on demand support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
