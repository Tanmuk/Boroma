import Image from 'next/image'
import { TRIAL_NUMBER } from '@/lib/env.client'

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

export default function Hero(){
  return (
    <section className="container mx-auto px-4 pt-[12vh] md:pt-[14vh] pb-12">
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
          <a href="/#pricing" className="btn btn-primary">Get 24/7 support now</a>
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
          className="w-full max-w-5xl mx-auto h-[420px] md:h-[520px] object-cover rounded-2xl border border-slate-200"
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
  )
}
