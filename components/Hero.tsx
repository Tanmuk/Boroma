import Image from 'next/image'
import Link from 'next/link'
export default function Hero(){
  const phone=process.env.NEXT_PUBLIC_PRIMARY_PHONE||'+1-555-0100'
  return (
    <section className="container pt-10 pb-16 text-center">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
        <div className="flex -space-x-2">
          <Image src="https://randomuser.me/api/portraits/women/32.jpg" alt="" width={32} height={32} className="rounded-full ring-2 ring-white"/>
          <Image src="https://randomuser.me/api/portraits/men/22.jpg" alt="" width={32} height={32} className="rounded-full ring-2 ring-white"/>
          <Image src="https://randomuser.me/api/portraits/women/65.jpg" alt="" width={32} height={32} className="rounded-full ring-2 ring-white"/>
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white ring-2 ring-white grid place-content-center text-[10px] font-semibold">+50K</div>
        </div>
        <div className="text-xs sm:text-sm text-slate-600">Trusted by seniors & families</div>
      </div>
      <h1 className="mx-auto max-w-4xl">
        Compassionate <span className="text-primary-500" style={{backgroundColor:'rgba(255,91,4,0.18)', backgroundRepeat:'no-repeat', backgroundSize:'100% 45%', backgroundPosition:'0 80%'}}>on-demand tech support</span> for seniors—help in minutes
      </h1>
      <p className="mx-auto max-w-2xl mt-4 text-lg text-slate-600">Patient, jargon-free assistance for phones, tablets, Wi-Fi, passwords, scams, and more—available remotely.</p>
      <div className="mt-8 flex justify-center"><a href={`tel:${phone}`} className="btn btn-primary">Talk to an Expert</a></div>
      <div className="relative mt-12">
        <Image src="/hero.png" alt="Happy grandma on the phone with supportive family member" width={1200} height={600} className="w-full max-w-5xl mx-auto h-[320px] md:h-[420px] object-cover rounded-2xl border border-slate-200"/>
        <div className="hidden md:block absolute left-16 top-16 w-64 bg-white border border-slate-200 rounded-xl p-5 text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-primary-400 to-primary-500 text-white grid place-content-center">IH</div>
            <div><div className="text-sm font-semibold text-slate-900">Instant Help</div><div className="text-xs text-slate-500">friendly & patient</div></div>
          </div>
          <div className="text-sm text-slate-600">Experts ready now for phones, tablets, Wi‑Fi and scam checks.</div>
          <div className="mt-2 text-xs text-primary-500">Avg wait time under 2 minutes</div>
        </div>
        <div className="hidden md:block absolute right-16 top-28 w-64 bg-white border border-slate-200 rounded-xl p-5 text-left">
          <div className="flex items-center justify-between mb-2"><span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wide">Popular issue</span><span className="text-primary-500 text-xs">!</span></div>
          <div className="text-slate-900 font-semibold">Wi‑Fi Not Connecting</div>
          <div className="text-xs text-slate-500 mb-3">3 steps • 5 min</div>
          <div className="text-xs text-primary-500">Guided steps included</div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-[92%] md:w-[420px]">
          <div className="flex items-center bg-white rounded-xl border border-slate-200 px-4 py-3">
            <span className="text-slate-400 mr-2">🔎</span>
            <input placeholder="Describe your tech issue..." className="w-full text-sm border-0 focus:ring-0 bg-transparent outline-none"/>
            <Link href="/what-we-solve" className="btn btn-primary px-3 py-2">Go</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
