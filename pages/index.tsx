import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import TrustPledge from '@/components/TrustPledge'
import { TRIAL_NUMBER } from '@/lib/env.client'
import { phCapture } from '@/lib/posthog'

export default function Home() {
  const [annual, setAnnual] = useState(false)
  const BASE_MONTHLY = 29
  const BASE_ANNUAL = 348
  const basePrice = annual ? BASE_ANNUAL : BASE_MONTHLY
  const discounted = useMemo(() => Math.round(basePrice * 0.6), [basePrice])

  return (
    <>
      <Head>
        <title>Boroma — Patient 24/7 phone-first tech help for seniors</title>
        <meta
          name="description"
          content="On-demand, 24/7 tech help with the patience your loved ones deserve. English, Spanish, Chinese. Toll-free line for members. Family gets summaries after each call."
        />
        <link rel="canonical" href="https://boroma.site/" />
        <meta property="og:title" content="Boroma — Patient 24/7 phone-first tech help for seniors" />
        <meta property="og:description" content="On-demand, 24/7 tech help with the patience your loved ones deserve." />
        <meta property="og:url" content="https://boroma.site/" />
        <meta property="og:type" content="website" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Boroma',
              url: 'https://boroma.site',
              contactPoint: [
                {
                  '@type': 'ContactPoint',
                  telephone: '+1-877-766-6307',
                  contactType: 'customer support',
                  areaServed: 'US',
                  availableLanguage: ['English', 'Spanish', 'Chinese'],
                },
              ],
            }),
          }}
        />
      </Head>

      {/* ================= HERO ================= */}
      <section id="hero" className="relative isolate">
        {/* green band at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[220px] bg-[#075056]" />
        <div className="container relative z-10 mx-auto px-4 pt-[12vh] md:pt-[14vh] pb-12 text-center">
          <div className="inline-flex items-center text-xs uppercase tracking-wide font-semibold px-3 py-1 rounded-full bg-[#FFEDD9] text-[#FF5B04]">
            Launch offer: Use code LAUNCH40 to get 40% off
          </div>

          <h1
            className="mx-auto mt-4 font-semibold leading-tight"
            style={{
              fontFamily: 'Mona Sans, ui-sans-serif, system-ui',
              // Mobile-safe sizing using clamp for responsiveness
              fontSize: 'clamp(34px, 6vw, 60px)',
            }}
          >
            On-demand, 24/7 tech help, with the patience your loved ones deserve
          </h1>

          <p className="mx-auto text-slate-600 mt-4 max-w-[650px]">
            Patient tech agents help with any device issue. No judgment, no rushing, no app downloads. Family stays
            informed with automatic summaries.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <a href="#pricing" className="btn btn-primary">Get 24/7 support now</a>
            <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">Try a call for free</a>
          </div>

          <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-slate-700">
            <li className="flex items-center gap-2"><CheckIcon /> <span>No waiting time</span></li>
            <li className="flex items-center gap-2"><CheckIcon /> <span>Switch language mid sentence</span></li>
            <li className="flex items-center gap-2"><CheckIcon /> <span>Report sent after call</span></li>
          </ul>

          {/* image + overlay cards */}
          <div className="mt-10 relative">
            <Image
              src="/hero.avif"
              alt="Patient phone-first help"
              width={1600}
              height={1000}
              className="w-full max-w-5xl mx-auto h-[420px] md:h-[540px] object-cover rounded-2xl border border-slate-200"
              priority
            />

            {/* Left card */}
            <div className="hidden md:block absolute left-4 md:left-6 bottom-4 md:bottom-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-4 w-[230px] md:w-[240px] text-left">
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
            <div className="hidden md:block absolute right-4 md:right-6 bottom-4 md:bottom-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-4 w-[250px] md:w-[260px] text-left">
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
        </div>
      </section>

      {/* ================= PROBLEM (green) ================= */}
      <section id="problem" className="relative isolate">
        <div className="absolute inset-0 bg-[#075056]" />
        <div className="container relative z-10 mx-auto px-4 py-16 text-white text-center">
          <div className="text-[#FFEDD9] text-xs uppercase tracking-wide font-semibold">The problem</div>
          <h2
            className="mt-2 mx-auto font-semibold leading-tight max-w-[700px]"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
          >
            Seniors need help in their specific way, today’s tools were not built for them
          </h2>
          <p className="mt-3 max-w-2xl mx-auto opacity-90">
            Hold music, confusing apps, language barriers and inconsistent advice add stress. Families need patient
            phone-first help that simply fixes the issue, safely.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {PROBLEMS.map((card, i) => (
              <div
                key={i}
                className="group bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/15 hover:scale-[1.03] transition-transform"
              >
                <div className="flex items-center gap-3 justify-center">
                  <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-white/15 border border-white/20">
                    {card.icon}
                  </span>
                  <div className="text-lg font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                    {card.title}
                  </div>
                </div>
                <p className="mt-8 text-white/90">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SOLUTION ================= */}
      <section id="solution" className="relative isolate">
        <div className="absolute inset-0 bg-white" />
        <div className="container relative z-10 mx-auto px-4 py-16 text-center">
          <div>
            <div className="section-label text-[#FF5B04]">Our solution</div>
            <h2
              className="mx-auto font-semibold mt-2 max-w-[700px]"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
            >
              Phone-first tech help designed for seniors
            </h2>
            <p className="text-slate-700 mt-3 max-w-2xl mx-auto">
              Boroma&apos;s tech agents are trained specifically for senior comfort and safety:
            </p>
          </div>

          <div className="mt-8 grid lg:grid-cols-3 gap-8 items-stretch">
            {/* Left column */}
            <ul className="space-y-3 self-stretch text-left">
              {SOLUTION_LEFT.map((t, i) => (
                <li
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:scale-[1.02] transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-[#FFEDD9] border border-[#FFD9B8]">
                      {t.icon}
                    </span>
                    <div className="font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                      {t.title}
                    </div>
                  </div>
                  <p className="text-slate-600 mt-8 text-sm">{t.desc}</p>
                </li>
              ))}
            </ul>

            {/* Middle image fills column height */}
            <div className="relative w-full self-stretch min-h-[360px]">
              <Image
                src="/Boroma solution.avif"
                alt="Boroma solution"
                fill
                sizes="(min-width: 1024px) 464px, 100vw"
                className="rounded-2xl border border-slate-200 object-cover"
              />
            </div>

            {/* Right column */}
            <ul className="space-y-3 self-stretch text-left">
              {SOLUTION_RIGHT.map((t, i) => (
                <li
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:scale-[1.02] transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-[#FFEDD9] border border-[#FFD9B8]">
                      {t.icon}
                    </span>
                    <div className="font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                      {t.title}
                    </div>
                  </div>
                  <p className="text-slate-600 mt-8 text-sm">{t.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS (min 80vh + centered) ================= */}
      <section id="how-it-works" className="relative isolate min-h-[80vh] grid content-center">
        <div className="absolute inset-0 bg-white" />
        <div className="container relative z-10 mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center justify-items-center">
            <div className="text-center md:text-left">
              <div className="section-label text-[#FF5B04]">How it works</div>
              <h2
                className="mt-2 font-semibold max-w-[700px]"
                style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
              >
                Three simple steps to peace of mind
              </h2>
              <p className="text-slate-600 mt-3 max-w-[520px] mx-auto md:mx-0">
                No apps, no accounts, no passwords. We made it super easy so the next tech call comes to us, not you.
              </p>
            </div>

            <ol className="grid gap-4 w-full max-w-[560px]">
              {[
                ['Step 1: Your Parent Calls', 'Just one number to remember: Toll Free number. No apps, no accounts, no passwords.'],
                ['Step 2: Patient Help in Their Language', 'Our agents listen carefully, explain clearly, and work at your parent’s pace.'],
                ['Step 3: You Stay Informed', 'Get a text summary of what happened, what was fixed, and any follow-up needed.'],
              ].map(([h, d], i) => (
                <li key={i} className="bg-white border border-slate-200 rounded-2xl p-5">
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
          </div>
        </div>
      </section>

      {/* ================= WHAT WE SOLVE ================= */}
      <section id="what-we-solve" className="relative isolate">
        <div className="absolute inset-0 bg-[#FFF6EB]" />
        <div className="container relative z-10 mx-auto px-4 py-16 text-center">
          <div>
            <div className="section-label text-[#FF5B04]">What we solve</div>
            <h2
              className="mx-auto font-semibold mt-2 max-w-[700px]"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
            >
              We cover most everyday issues, here are the popular ones
            </h2>
            <p className="text-slate-600 mt-3">Phone, Wi-Fi, passwords, scams, app setup, photos, printers, and more</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8 max-w-6xl mx-auto">
            {POPULAR_ISSUES.map((it, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
                <div className="font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>{it.title}</div>
                <div className="text-slate-500 text-sm mt-1">{it.meta}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a href="/what-we-solve" className="btn btn-light">View more</a>
          </div>
        </div>
      </section>

      {/* ================= SCAM-FREE PLEDGE (green) — stronger contrast heading ================= */}
      <section className="relative isolate">
        <div className="absolute inset-0 bg-[#075056]" />
        <div className="container relative z-10 mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-[#FFEDD9] text-xs uppercase tracking-wide font-semibold">Safety</div>
            <h2
              className="mt-2 font-semibold text-white"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
            >
              Our Scam-Free Pledge
            </h2>
          </div>
          <TrustPledge />
        </div>
      </section>

      {/* ================= TESTIMONIALS (min 80vh + centered) ================= */}
      <section id="testimonials" className="relative isolate min-h-[80vh] grid content-center">
        <div className="absolute inset-0 bg-white" />
        <div className="container relative z-10 mx-auto px-4 py-16 text-center">
          <div>
            <div className="section-label text-[#FF5B04]">Testimonials</div>
            <h2
              className="mx-auto font-semibold mt-2 max-w-[700px]"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
            >
              Families who found peace of mind
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-6xl mx-auto justify-items-center">
            <Testimonial
              img="/Maria.png"
              name="Maria C."
              location="San Diego"
              quote="My 78-year-old mom calls Boroma instead of me at midnight when her iPad ‘breaks.’ The agents are so patient with her, and I get a text explaining it was just a software update. Worth every penny for my sanity."
            />
            <Testimonial
              img="/Carlos.png"
              name="Carlos R."
              location="Phoenix"
              quote="Dad speaks mostly Spanish and regular tech support frustrated him. Boroma agents switch to Spanish immediately and explain everything clearly. He actually enjoys the calls now."
            />
            <Testimonial
              img="/Jennifer.png"
              name="Jennifer L."
              location="Miami"
              quote="Mom was getting scam calls pretending to be tech support. Boroma agents taught her how to identify fake calls and now she feels confident. The family summaries help me stay involved without hovering."
            />
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="relative isolate">
        <div className="absolute inset-0 bg-[#075056]" />
        <div className="container relative z-10 mx-auto px-4 py-16 text-center text-white">
          <div>
            <div className="section-label text-[#FFEDD9]">Pricing</div>
            <h2
              className="mx-auto font-semibold mt-2 max-w-[700px]"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
            >
              Peace of mind for one fixed price
            </h2>
            <p className="opacity-90 mt-3">Cancel anytime. Launch special may apply.</p>
          </div>

          <div className="mt-8 grid lg:grid-cols-[1fr_420px] gap-8 items-start text-left">
            {/* Main pricing card */}
            <div className="border rounded-2xl p-6 bg-white text-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm uppercase text-[#FF5B04] font-semibold">Boroma Plan</div>
                  <div className="text-2xl font-semibold mt-1">{annual ? 'Annual' : 'Monthly'}</div>
                </div>
                <label className="inline-flex items-center gap-3 text-sm select-none">
                  <span>Save 40% with annual plan instead</span>
                  <button
                    type="button"
                    onClick={() => setAnnual(a => !a)}
                    className={`relative w-12 h-6 rounded-full transition ${annual ? 'bg-[#FF5B04]' : 'bg-slate-300'}`}
                    aria-pressed={annual}
                  >
                    <span className={`absolute top-0.5 ${annual ? 'right-0.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white transition`} />
                  </button>
                </label>
              </div>

              {/* Price row with strike-through base and discounted bold */}
              <div className="mt-4 flex items-baseline gap-3 sm:gap-4 flex-wrap">
                <div className="text-3xl line-through text-slate-400">${basePrice}</div>
                <div className="text-5xl font-semibold text-slate-900">${discounted}</div>
                <div className="text-base text-slate-500">/{annual ? 'yr' : 'mo'}</div>
              </div>

              <ul className="mt-4 space-y-2 text-slate-700">
                <li>• 24/7 phone first tech help</li>
                <li>• Up to 10 calls/month, 35 mins each</li>
                <li>• Toll free number for paid members</li>
                <li>• Fridge magnet print</li>
                <li>• Call report after each call</li>
                <li>• Scam aware guidance and guardrails</li>
                <li>• Covers common issues on any device</li>
                <li>• Multilingual: English, Spanish, Chinese</li>
                <li>• Works on any phone, no apps</li>
              </ul>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link href={`/signup?plan=${annual ? 'annual' : 'monthly'}`} className="btn btn-primary">
                  Get 24/7 support now
                </Link>
                <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">
                  Try a call for free
                </a>
              </div>
            </div>

            {/* Offer card — redesigned with animated border and code pill */}
            <aside className="offer-animate rounded-3xl p-[2px]">
              <div className="rounded-3xl p-6 bg-[#FF5B04] text-white relative overflow-hidden">
                <div className="text-sm uppercase font-semibold tracking-wide">Launch special — 40% off</div>

                <div className="mt-3">
                  <span className="text-sm">Use code:</span>{' '}
                  <span className="inline-block bg-white text-[#FF5B04] font-semibold px-2.5 py-1 rounded-md shadow-sm">
                    LAUNCH40
                  </span>
                </div>

                <div className="mt-3">Available for both <strong>MONTHLY</strong> &amp; <strong>ANNUALLY</strong></div>

                <div className="mt-5 text-xs opacity-90 leading-relaxed">
                  ⏰ This pricing ends <strong>October 15th, 2025</strong><br />
                  New members after this date pay $29/month or $348/year
                </div>

                {/* subtle corner flare */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/15 blur-2xl" />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="relative isolate">
        <div className="absolute inset-0 bg-white" />
        <div className="container relative z-10 mx-auto px-4 py-16 text-center">
          <div>
            <div className="section-label text-[#FF5B04]">FAQ</div>
            <h2
              className="mx-auto font-semibold mt-2 max-w-[700px]"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
            >
              Questions families ask us
            </h2>
          </div>

          <div className="max-w-3xl mx-auto mt-8 text-left">
            {FAQ_ITEMS.map((qa, idx) => (
              <details key={idx} className="border rounded-2xl p-5 mb-3 bg-white">
                <summary className="cursor-pointer font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                  {qa.q}
                </summary>
                <p className="text-slate-600 mt-2">{qa.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="relative isolate">
        <div className="absolute inset-0 bg-[#FFF6EB]" />
        <div className="container relative z-10 mx-auto px-4 py-16 text-center">
          <h2
            className="mx-auto font-semibold max-w-[700px]"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '36px' }}
          >
            Ready for peaceful tech support?
          </h2>
          <p className="text-slate-600 mt-3 max-w-[700px] mx-auto">
            Get your family covered with patient, phone first help available day and night.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <a href="#pricing" className="btn btn-primary">Get 24/7 support now</a>
            <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">Try a call for free</a>
          </div>
        </div>
      </section>

      {/* animated gradient border for the orange offer card */}
      <style jsx global>{`
        .offer-animate {
          background: linear-gradient(90deg, #ff7a1a, #ffc078, #ff7a1a);
          background-size: 200% 100%;
          animation: borderMove 3s linear infinite;
        }
        @keyframes borderMove {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>
    </>
  )
}

/* ---------- helpers & content ---------- */

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

/* Problem icons (white for green background) */
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
      <path d="M12 7v6l4 2" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12a7 7 0 0 1-7 7H7l-4 3 1.2-4.8A7 7 0 0 1 7 5h7a7 7 0 0 1 7 7Z"
        stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}
function ShieldIconWhite() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PROBLEMS = [
  { title: 'Timing issues', desc: 'Waiting hours on hold during business hours only.', icon: <ClockIcon /> },
  { title: 'Fear of judgement', desc: 'Getting rushed through solutions they don’t understand.', icon: <ChatIcon /> },
  { title: 'Safety worries', desc: 'Worrying about scams asking for passwords or access codes.', icon: <ShieldIconWhite /> },
]

/* Solution icons (all orange — fixed Scam-aware to match) */
function SmileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#FF5B04" strokeWidth="2" />
      <path d="M8 14c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" fill="#FF5B04" /><circle cx="15" cy="10" r="1" fill="#FF5B04" />
    </svg>
  )
}
function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#FF5B04" strokeWidth="2" />
      <path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function ShieldIconOrange() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="#FF5B04" strokeWidth="2" />
      <path d="M5 8l7 5 7-5" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="#FF5B04" strokeWidth="2" />
      <circle cx="9" cy="18" r="1" fill="#FF5B04" />
    </svg>
  )
}
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.5" stroke="#FF5B04" strokeWidth="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const SOLUTION_LEFT = [
  { title: 'Always patient', desc: 'Never rushed, never judged, always kind.', icon: <SmileIcon /> },
  { title: 'Speak your language', desc: 'English, Spanish, Chinese — switch anytime.', icon: <GlobeIcon /> },
  // FIXED: orange shield like others
  { title: 'Scam-aware', desc: 'We never ask for passwords, OTPs, or personal info.', icon: <ShieldIconOrange /> },
]

const SOLUTION_RIGHT = [
  { title: 'Family-informed', desc: 'You get summaries of what was fixed in email.', icon: <MailIcon /> },
  { title: 'Available 24/7', desc: 'Help when panic strikes, not just business hours.', icon: <SunIcon /> },
  { title: 'Phone-first', desc: 'Works on any phone, no apps ever.', icon: <PhoneIcon /> },
]

const POPULAR_ISSUES = [
  { title: 'Wi-Fi Not Connecting', meta: '3 steps • 5–8 min' },
  { title: 'Phone Storage Full', meta: '4 steps • 6–10 min' },
  { title: 'Password Reset Basics', meta: '4 steps • 5–7 min' },
  { title: 'Email Setup & Fix', meta: '3 steps • 6–8 min' },
  { title: 'WhatsApp / Facebook Login', meta: '3 steps • 5–8 min' },
  { title: 'OS & App Updates', meta: '3 steps • 4–6 min' },
  { title: 'Scam / SMS Safety Check', meta: '2 steps • 3–5 min' },
  { title: 'Contacts/Calendar Sync', meta: '3 steps • 5–8 min' },
  { title: 'Bluetooth Pairing', meta: '3 steps • 4–6 min' },
]

const FAQ_ITEMS = [
  { q: 'Is this real people or AI?', a: "Our tech agents use AI to provide consistent, patient help 24/7. They're trained specifically for senior comfort and safety — no bad days, no rushed calls, no judgment." },
  { q: "What if my parent doesn't speak English well?", a: 'Perfect! Our agents speak English, Spanish, and Chinese fluently and can switch languages mid-conversation based on what’s most comfortable.' },
  { q: 'Will they ask for passwords or access to devices?', a: 'Never. Our Scam-Free Pledge guarantees we never request passwords, OTPs, banking information, or remote access to devices.' },
  { q: "What happens if they can't solve the problem?", a: "We handle 95% of common tech issues. When we can't solve something, we clearly explain why and provide specific next steps or referrals." },
  { q: 'How do I know what happened during the call?', a: 'You receive a detailed text summary within minutes of each call ending, explaining what was discussed and what was resolved.' },
  { q: 'Can I get recordings of the calls?', a: 'Yes, all calls are recorded up to 30 days and available upon request for quality and safety purposes.' },
  { q: "What's the difference between the free trial and paid service?", a: 'Free trial is one call per phone number with a time limit. Paid members get our dedicated toll-free line with 10 calls monthly, 35 minutes each.' },
  { q: 'How quickly can someone answer?', a: 'Typically under 2 minutes, 24/7. No hold music, no phone trees, just patient help.' },
  { q: 'What if my parent calls too often?', a: 'Most families use 3–4 calls monthly. If they reach the 10-call limit, additional calls are $4.99 each or they can upgrade.' },
  { q: "Is my parent's information safe?", a: 'Yes. We follow strict privacy protocols and never share personal information. See our Privacy Policy for full details.' },
]

function Testimonial({ img, name, location, quote }: { img: string; name: string; location: string; quote: string }) {
  return (
    <div className="border rounded-2xl p-5 bg-white max-w-[480px] w-full text-left">
      <div className="flex items-start gap-4">
        <Image src={img} alt={name} width={48} height={48} className="rounded-full border border-slate-200" />
        <div>
          <div className="font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>{name}</div>
          <div className="text-sm text-slate-500">{location}</div>
          <p className="text-slate-700 mt-3">{quote}</p>
        </div>
      </div>
    </div>
  )
}
