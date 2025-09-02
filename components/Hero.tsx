import Image from 'next/image'
import Link from 'next/link'

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#FF5B04" fillOpacity="0.12"/>
    <path d="M7 12.5l3 3 7-7" stroke="#FF5B04" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CardIconPhone = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="2" width="14" height="20" rx="2" stroke="#FF5B04" strokeWidth="2"/>
    <circle cx="12" cy="18" r="1.5" fill="#FF5B04"/>
  </svg>
)

const CardIconShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="#FF5B04" strokeWidth="2" fill="none"/>
    <path d="M9.5 12.2l2 2 3.8-4.2" stroke="#FF5B04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Hero(){
  const phone = process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100'
  return (
    <section className="container pt-6 pb-10 text-center relative">
      {/* Eyebrow badge */}
      <div className="flex justify-center mb-5">
        <span className="eyebrow">Launch offer: Use code LAUNCH40 to get 40% off</span>
      </div>

      {/* Headline and subcopy with tighter, professional spacing */}
      <h1 className="mx-auto max-w-5xl">
        Unlimited 24/7 tech help, with the patience your loved ones deserve
      </h1>
      <p className="mx-auto max-w-2xl mt-3 text-lg text-slate-600">
        Our tech agents fixes tech issues for seniors step by step in one call, no app, no OTP codes, no sighs
      </p>

      {/* CTAs */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/signup" className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]">
          Unlock unlimited support
        </Link>
        <a href={`tel:${phone}`} className="btn btn-outline">Try a call for free</a>
      </div>

      {/* Checkmarks with orange icons */}
      <div className="mt-5 flex flex-col sm:flex-row gap-5 justify-center text-sm text-slate-700">
        <div className="flex items-center gap-2 justify-center"><Check/><span>No waiting time</span></div>
        <div className="flex items-center gap-2 justify-center"><Check/><span>Switch language mid sentence</span></div>
        <div className="flex items-center gap-2 justify-center"><Check/><span>Report sent after call</span></div>
      </div>

      {/* Hero media, overhang into the next section */}
      <div className="relative mt-10 mb-[-80px] z-[1]">
        <Image
          src="/hero.avif"
          alt="Grandma getting patient phone support"
          width={1200}
          height={600}
          className="w-full max-w-5xl mx-auto h-[320px] md:h-[420px] object-cover rounded-2xl border border-slate-200"
          priority
        />

        {/* Two offset cards only, smaller type, orange labels, hang a bit lower */}
        <div className="hidden md:block absolute left-12 bottom-[-28px] w-60 bg-white border border-slate-200 rounded-xl p-4 text-left">
          <div className="section-label">Phone first</div>
          <div className="flex items-center gap-2 mt-1">
            <CardIconPhone/><div className="font-semibold text-slate-900 text-base">Zero setup</div>
          </div>
          <p className="text-sm text-slate-600 mt-1">Works on any phone, no apps ever</p>
        </div>

        <div className="hidden md:block absolute right-12 bottom-[-28px] w-60 bg-white border border-slate-200 rounded-xl p-4 text-left">
          <div className="section-label">Scam aware coaching</div>
          <div className="flex items-center gap-2 mt-1">
            <CardIconShield/><div className="font-semibold text-slate-900 text-base">Stay safe</div>
          </div>
          <p className="text-sm text-slate-600 mt-1">We teach red flags and safer habits</p>
        </div>
      </div>
    </section>
  )
}
