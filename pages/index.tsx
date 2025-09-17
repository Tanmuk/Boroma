import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import TrustPledge from '@/components/TrustPledge'
import { TRIAL_NUMBER } from '@/lib/env.client'

export default function Home() {
  const [annual, setAnnual] = useState(false)
  const mPrice = 29
  const yPrice = 348

  return (
    <>
      <Head>
        <title>Boroma — Patient 24/7 phone-first tech help for seniors</title>
        <meta name="description" content="On-demand, 24/7 tech help with the patience your loved ones deserve. English, Spanish, Chinese. Toll-free line for members. Family gets summaries after each call." />
      </Head>

      {/* HERO */}
      <section className="container mx-auto px-4 pt-[12vh] md:pt-[14vh] pb-12 min-h-[80vh]" id="hero">
        <div className="text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center text-xs uppercase tracking-wide font-semibold px-3 py-1 rounded-full bg-[#FFEDD9] text-[#FF5B04]">
            Launch offer: Use code LAUNCH40 to get 40% off
          </div>

          {/* H1 */}
          <h1
            className="mx-auto mt-4 font-semibold leading-tight"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontWeight: 600, fontSize: '60px', maxWidth: '650px' }}
          >
            On-demand, 24/7 tech help, with the patience your loved ones deserve
          </h1>

          {/* Subcopy */}
          <p className="mx-auto text-slate-600 mt-4 max-w-[650px]">
            Patient tech agents help with any device issue. No judgment, no rushing, no app downloads. Family stays informed with automatic summaries.
          </p>

          {/* CTA row */}
          <div className="mt-6 flex justify-center gap-3">
            <a href="#pricing" className="btn btn-primary">Get 24/7 support now</a>
            <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">Try a call for free</a>
          </div>

          {/* Benefit chips */}
          <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-slate-700">
            <li className="flex items-center gap-2"><CheckIcon /> <span>No waiting time</span></li>
            <li className="flex items-center gap-2"><CheckIcon /> <span>Switch language mid sentence</span></li>
            <li className="flex items-center gap-2"><CheckIcon /> <span>Report sent after call</span></li>
          </ul>
        </div>

        {/* Image + overlay cards */}
        <div className="mt-10 relative">
          <Image
            src="/hero.avif"
            alt="Patient phone-first help"
            width={1600}
            height={1000}
            className="w-full max-w-5xl mx-auto h-[520px] md:h-[620px] object-cover rounded-2xl border border-slate-200"
            priority
          />

          {/* Left card */}
          <div className="hidden md:block absolute left-6 bottom-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-4 w-[240px]">
              <div className="text-[11px] font-semibold uppercase text-[#FF5B04]" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                Phone first
              </div>
              <div className="mt-1 font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                Zero setup
              </div>
              <div className="text-sm text-slate-600">Works on any phone, no apps ever</div>
            </div>
          </div>

          {/* Right card */}
          <div className="hidden md:block absolute right-6 bottom-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-4 w-[260px]">
              <div className="text-[11px] font-semibold uppercase text-[#FF5B04]" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                Scam aware coaching
              </div>
              <div className="mt-1 font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                Stay safe
              </div>
              <div className="text-sm text-slate-600">We teach red flags and safer habits</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="py-16 md:py-20 min-h-[80vh]" style={{ background: '#075056' }}>
        <div className="container mx-auto px-4 text-white">
          <div className="text-center">
            <div className="text-[#FFEDD9] text-xs uppercase tracking-wide font-semibold">The problem</div>
            <h2
              className="mt-2 mx-auto font-semibold leading-tight"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px', maxWidth: '760px' }}
            >
              Seniors need help in their specific way, today’s tools were not built for them
            </h2>
            <p className="mt-3 max-w-2xl mx-auto opacity-90">
              Hold music, confusing apps, language barriers and inconsistent advice add stress. Families need patient phone-first help
              that simply fixes the issue, safely.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {PROBLEMS.map((card, i) => (
              <div
                key={i}
                className="group bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/15 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-white/15 border border-white/20">
                    {card.icon}
                  </span>
                  <div
                    className="font-semibold"
                    style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}
                  >
                    {card.title}
                  </div>
                </div>
                <p className="mt-2 text-white/90">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="container mx-auto px-4 py-16 min-h-[80vh]" style={{ background: 'linear-gradient(180deg,#FFF3E8 0%,#FFFFFF 70%)' }}>
        <div className="text-center">
          <div className="section-label text-[#FF5B04]">Our solution</div>
          <h2
            className="mx-auto font-semibold mt-2"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px', maxWidth: '640px' }}
          >
            Phone-first tech help designed for seniors
          </h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
            Boroma&apos;s tech agents are trained specifically for senior comfort and safety:
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start mt-8">
          {/* Left column */}
          <ul className="space-y-4">
            {SOLUTION_LEFT.map((t, i) => (
              <li key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:scale-[1.02] transition">
                <div className="flex items-center gap-3">
                  <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-[#FFEDD9] border border-[#FFD9B8]">{t.icon}</span>
                  <div className="font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>{t.title}</div>
                </div>
                <p className="text-slate-600 mt-1">{t.desc}</p>
              </li>
            ))}
          </ul>

          {/* Middle image */}
          <div className="flex justify-center">
            <Image
              src="/Boroma solution.avif"
              alt="Boroma solution"
              width={700}
              height={900}
              className="rounded-2xl w-full max-w-[420px] border border-slate-200"
            />
          </div>

          {/* Right column */}
          <ul className="space-y-4">
            {SOLUTION_RIGHT.map((t, i) => (
              <li key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:scale-[1.02] transition">
                <div className="flex items-center gap-3">
                  <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-[#FFEDD9] border border-[#FFD9B8]">{t.icon}</span>
                  <div className="font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>{t.title}</div>
                </div>
                <p className="text-slate-600 mt-1">{t.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="container mx-auto px-4 py-16 min-h-[80vh]">
        <div className="text-center">
          <div className="section-label text-[#FF5B04]">How it works</div>
          <h2
            className="mx-auto font-semibold mt-2"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px', maxWidth: '600px' }}
          >
            Three simple steps to peace of mind
          </h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto">No apps, no accounts, no passwords.</p>
        </div>

        <ol className="max-w-3xl mx-auto mt-8 space-y-5">
          {[
            ['Step 1: Your Parent Calls', 'Just one number to remember: 1-877-766-6307. No apps, no accounts, no passwords.'],
            ['Step 2: Patient Help in Their Language', 'Our agents listen carefully, explain clearly, and work at your parent’s pace.'],
            ['Step 3: You Stay Informed', 'Get a text summary of what happened, what was fixed, and any follow-up needed.'],
          ].map(([h, d], i) => (
            <li key={i} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-[#FFEDD9] text-[#FF5B04] grid place-content-center font-semibold">{`0${i + 1}`}</span>
                <div>
                  <div className="font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>{h}</div>
                  <div className="text-slate-600 mt-1">{d}</div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* SAFETY / PLEDGE */}
      <TrustPledge />

      {/* TESTIMONIALS */}
      <section id="testimonials" className="container mx-auto px-4 py-16 min-h-[80vh]">
        <div className="text-center">
          <div className="section-label text-[#FF5B04]">Testimonials</div>
          <h2
            className="mx-auto font-semibold mt-2"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px', maxWidth: '500px' }}
          >
            Families who found peace of mind
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            '“My 78-year-old mom calls Boroma instead of me at midnight when her iPad ‘breaks.’ The agents are so patient with her, and I get a text explaining it was just a software update. Worth every penny for my sanity.” — Maria C., San Diego',
            '“Dad speaks mostly Spanish and regular tech support frustrated him. Boroma agents switch to Spanish immediately and explain everything clearly. He actually enjoys the calls now.” — Carlos R., Phoenix',
            '“Mom was getting scam calls pretending to be tech support. Boroma agents taught her how to identify fake calls and now she feels confident. The family summaries help me stay involved without hovering.” — Jennifer L., Miami',
          ].map((q, i) => (
            <blockquote key={i} className="border rounded-xl p-5 bg-white">
              <p className="text-slate-700">{q}</p>
            </blockquote>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container mx-auto px-4 py-16 min-h-[80vh]">
        <div className="text-center">
          <div className="section-label text-[#FF5B04]">Pricing</div>
          <h2
            className="mx-auto font-semibold mt-2"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px', maxWidth: '500px' }}
          >
            Peace of mind for one fixed price
          </h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
            Cancel anytime. Launch special may apply.
          </p>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Card */}
          <div className="border rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase text-[#FF5B04] font-semibold">Boroma Plan</div>
                <div className="text-2xl font-semibold mt-1">{annual ? 'Annual' : 'Monthly'}</div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <span>Bill monthly</span>
                <input type="checkbox" className="toggle" checked={annual} onChange={e => setAnnual(e.target.checked)} />
                <span>Bill annually</span>
              </label>
            </div>

            <div className="mt-4">
              <div className="text-4xl font-semibold">
                ${annual ? yPrice : mPrice}
                <span className="text-base font-normal text-slate-500">/{annual ? 'yr' : 'mo'}</span>
              </div>

              <ul className="mt-4 space-y-2 text-slate-700">
                <li>• 24/7 phone-first tech help</li>
                <li>• Up to 10 calls/mo, 35 minutes each (25-min reminder)</li>
                <li>• Toll-free number for paid members</li>
                <li>• Fridge magnet print</li>
                <li>• Call report after each call</li>
                <li>• Scam-aware guidance & guardrails</li>
                <li>• Covers common issues on any device</li>
                <li>• Multilingual — English, Spanish, Chinese</li>
                <li>• Works on any phone, no apps</li>
                <li>• Patient, professional agents</li>
              </ul>

              <div className="mt-6 flex gap-3">
                <Link href={`/signup?plan=${annual ? 'annual' : 'monthly'}`} className="btn btn-primary">
                  Get 24/7 support now
                </Link>
                <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">
                  Try a call for free
                </a>
              </div>
            </div>
          </div>

          {/* Side promo */}
          <aside className="border rounded-2xl p-6">
            <div className="text-sm uppercase text-[#FF5B04] font-semibold">Launch special — 40% off</div>
            <div className="mt-2">Use code: <span className="font-semibold">LAUNCH40</span></div>
            <div className="text-slate-600 mt-1">⏰ This pricing ends October 31st, 2025</div>
            <div className="text-slate-600 mt-1">New members after October pay $29/month</div>
          </aside>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-16 min-h-[80vh]">
        <div className="text-center">
          <div className="section-label text-[#FF5B04]">FAQ</div>
          <h2
            className="mx-auto font-semibold mt-2"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px', maxWidth: '500px' }}
          >
            Questions families ask us
          </h2>
        </div>

        <div className="max-w-3xl mx-auto mt-8">
          {FAQ_ITEMS.map((qa, idx) => (
            <details key={idx} className="border rounded-xl p-5 mb-3">
              <summary className="cursor-pointer font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>{qa.q}</summary>
              <p className="text-slate-600 mt-2">{qa.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}

/* ---------- UI helpers & content ---------- */

function CheckIcon() {
  return (
    <span className="inline-grid place-items-center w-5 h-5 rounded-full" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#FFE7D6" />
        <path d="M6 10.2l2.3 2.3L14 7" stroke="#FF5B04" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

function ClockIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.9" strokeWidth="2"/>
      <path d="M12 7v6l4 2" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ChatIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 12a7 7 0 0 1-7 7H7l-4 3 1.2-4.8A7 7 0 0 1 7 5h7a7 7 0 0 1 7 7Z" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ShieldIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const PROBLEMS = [
  {
    title: 'Timing issues',
    desc: 'Waiting hours on hold during business hours only.',
    icon: <ClockIcon />
  },
  {
    title: 'Fear of judgement',
    desc: 'Getting rushed through solutions they don’t understand.',
    icon: <ChatIcon />
  },
  {
    title: 'Safety worries',
    desc: 'Worrying about scams asking for passwords or access codes.',
    icon: <ShieldIcon />
  },
]

function SmileIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#FF5B04" strokeWidth="2"/>
      <path d="M8 14c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="10" r="1" fill="#FF5B04"/><circle cx="15" cy="10" r="1" fill="#FF5B04"/>
    </svg>
  )
}
function GlobeIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#FF5B04" strokeWidth="2"/>
      <path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function MailIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="#FF5B04" strokeWidth="2"/>
      <path d="M5 8l7 5 7-5" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function PhoneIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="#FF5B04" strokeWidth="2"/>
      <circle cx="9" cy="18" r="1" fill="#FF5B04"/>
    </svg>
  )
}
function SunIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.5" stroke="#FF5B04" strokeWidth="2"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const SOLUTION_LEFT = [
  { title: 'Always patient', desc: 'Never rushed, never judged, always kind.', icon: <SmileIcon/> },
  { title: 'Speak your language', desc: 'English, Spanish, Chinese — switch anytime.', icon: <GlobeIcon/> },
  { title: 'Scam-aware', desc: 'We never ask for passwords, OTPs, or personal info.', icon: <ShieldIcon/> },
]

const SOLUTION_RIGHT = [
  { title: 'Family-informed', desc: 'You get summaries of what was fixed in email.', icon: <MailIcon/> },
  { title: 'Available 24/7', desc: 'Help when panic strikes, not just business hours.', icon: <SunIcon/> },
  { title: 'Phone-first', desc: 'Works on any phone, no apps ever.', icon: <PhoneIcon/> },
]

const FAQ_ITEMS = [
  {
    q: 'Is this real people or AI?',
    a: "Our tech agents use AI to provide consistent, patient help 24/7. They're trained specifically for senior comfort and safety — no bad days, no rushed calls, no judgment."
  },
  {
    q: "What if my parent doesn't speak English well?",
    a: 'Perfect! Our agents speak English, Spanish, and Chinese fluently and can switch languages mid-conversation based on what’s most comfortable.'
  },
  {
    q: 'Will they ask for passwords or access to devices?',
    a: 'Never. Our Scam-Free Pledge guarantees we never request passwords, OTPs, banking information, or remote access to devices.'
  },
  {
    q: "What happens if they can't solve the problem?",
    a: "We handle 95% of common tech issues. When we can't solve something, we clearly explain why and provide specific next steps or referrals."
  },
  {
    q: 'How do I know what happened during the call?',
    a: 'You receive a detailed text summary within minutes of each call ending, explaining what was discussed and what was resolved.'
  },
  {
    q: 'Can I get recordings of the calls?',
    a: 'Yes, all calls are recorded up to 30 days and available upon request for quality and safety purposes.'
  },
  {
    q: "What's the difference between the free trial and paid service?",
    a: 'Free trial is one call per phone number with a time limit. Paid members get our dedicated toll-free line with 10 calls monthly, 35 minutes each.'
  },
  {
    q: 'How quickly can someone answer?',
    a: 'Typically under 2 minutes, 24/7. No hold music, no phone trees, just patient help.'
  },
  {
    q: 'What if my parent calls too often?',
    a: 'Most families use 3–4 calls monthly. If they reach the 10-call limit, additional calls are $4.99 each or they can upgrade.'
  },
  {
    q: "Is my parent's information safe?",
    a: 'Yes. We follow strict privacy protocols and never share personal information. See our Privacy Policy for full details.'
  },
]

function CheckIcon() {
  return (
    <span className="inline-grid place-items-center w-5 h-5 rounded-full" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#FFE7D6" />
        <path d="M6 10.2l2.3 2.3L14 7" stroke="#FF5B04" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

