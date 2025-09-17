import Image from 'next/image'
import { TRIAL_NUMBER } from '@/lib/env.client'

export default function Hero(){
  return (
    <section className="container mx-auto px-4 pt-[12vh] md:pt-[14vh] pb-12">
      <div className="text-center">
        <div className="inline-flex items-center text-xs uppercase tracking-wide font-semibold px-3 py-1 rounded-full bg-[#FFEDD9] text-[#FF5B04]">
          Make your first call free
        </div>

        <h1 className="max-w-[640px] mx-auto mt-4 text-3xl sm:text-5xl font-semibold tracking-tight">
          On-demand, 24/7 tech help, with the patience your loved ones deserve
        </h1>

        <p className="max-w-[640px] mx-auto text-slate-600 mt-4">
          Patient tech agents help with any device issue. No judgment, no rushing, no scams. Family stays informed with automatic summaries.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <a href="/#pricing" className="btn btn-primary">Get 24/7 support now</a>
          <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">Try a call for free</a>
        </div>
      </div>

      <div className="mt-10 relative">
        <Image
          src="/hero.avif"
          alt="Patient phone-first help"
          width={1600}
          height={900}
          className="w-full max-w-5xl mx-auto h-[320px] md:h-[420px] object-cover rounded-2xl border border-slate-200"
          priority
        />
      </div>
    </section>
  )
}
