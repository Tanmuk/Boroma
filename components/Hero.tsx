import Image from 'next/image'
import Link from 'next/link'

export default function Hero(){
  const phone = process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100'
  return (
    <section className="container pt-6 pb-16 text-center">
      {/* Eyebrow banner */}
      <div className="flex justify-center mb-6">
        <span className="eyebrow">Make your first call for free</span>
      </div>

      {/* Headline & subcopy */}
      <h1 className="mx-auto max-w-5xl">
        Unlimited 24/7 tech help, with the patience your loved ones deserve
      </h1>
      <p className="mx-auto max-w-2xl mt-4 text-lg text-slate-600">
        Patient, jargon-free assistance that fixes tech issues for seniors in one call.
        No app. No OTPs. Just a call.
      </p>

      {/* CTAs */}
      <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/signup" className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">Start now</Link>
        <a href={`tel:${phone}`} className="btn btn-outline">Call now for free</a>
      </div>

      {/* Checkmarks */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center text-sm text-slate-700">
        <div>✅ No waiting time</div>
        <div>✅ Switch language mid-sentence</div>
        <div>✅ Report sent after call</div>
      </div>

      {/* Hero media with three offset cards */}
      <div className="relative mt-10">
        <Image
          src="/hero.avif"
          alt="Grandma getting patient phone support"
          width={1200}
          height={600}
          className="w-full max-w-5xl mx-auto h-[320px] md:h-[420px] object-cover rounded-2xl border border-slate-200"
          priority
        />

        {/* Offset cards */}
        <div className="hidden md:block absolute left-12 top-12 w-64 bg-white border border-slate-200 rounded-xl p-5 text-left">
          <div className="text-xs uppercase text-slate-500 font-semibold">Phone-first</div>
          <div className="text-slate-900 font-semibold mt-1">Zero setup</div>
          <p className="text-sm text-slate-600 mt-2">Works on any phone. No apps ever.</p>
        </div>

        <div className="hidden md:block absolute right-12 top-20 w-64 bg-white border border-slate-200 rounded-xl p-5 text-left">
          <div className="text-xs uppercase text-slate-500 font-semibold">Scam-aware coaching</div>
          <div className="text-slate-900 font-semibold mt-1">Stay safe</div>
          <p className="text-sm text-slate-600 mt-2">We teach red-flags and safer habits.</p>
        </div>

        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 -bottom-6 w-72 bg-white border border-slate-200 rounded-xl p-5 text-left">
          <div className="text-xs uppercase text-slate-500 font-semibold">Clear boundaries</div>
          <div className="text-slate-900 font-semibold mt-1">Your privacy protected</div>
          <p className="text-sm text-slate-600 mt-2">We never ask for OTPs or passwords.</p>
        </div>
      </div>
    </section>
  )
}
