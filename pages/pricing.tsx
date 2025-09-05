import React from 'react'

export default function PricingPage(){
  return (
    <main className="container py-16 text-center">
      <div className="section-label">Pricing</div>
      <h1>Peace of mind for one fixed price</h1>
      <p className="text-slate-600 mt-2">Cancel anytime, this is our introductory price, price may change in the future</p>
      <div className="mt-8 max-w-3xl mx-auto">
        <PricingCard />
      </div>
    </main>
  )
}

function PricingCard(){
  const [annual, setAnnual] = React.useState(false)
  const priceMonthly = 29
  const priceAnnual = 348

  return (
    <div className="card p-8 text-left">
      <div className="flex items-center gap-3">
        <div className="font-semibold">Plan</div>
        <div role="tablist" aria-label="Billing period" className="ml-auto inline-flex rounded-full border border-slate-200 p-1 bg-white">
          <button
            role="tab"
            aria-selected={!annual}
            className={`px-4 py-2 rounded-full text-sm font-medium ${!annual ? 'bg-[#FFEDD9] text-slate-900' : 'text-slate-600'}`}
            onClick={() => setAnnual(false)}
          >Monthly</button>
          <button
            role="tab"
            aria-selected={annual}
            className={`px-4 py-2 rounded-full text-sm font-medium ${annual ? 'bg-[#FFEDD9] text-slate-900' : 'text-slate-600'}`}
            onClick={() => setAnnual(true)}
          >Annually</button>
        </div>
      </div>

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
        </ul>

        <div className="mt-6">
          <a
            href={`/signup?plan=${annual ? 'annual' : 'monthly'}`}
            className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]"
          >
            Unlock on demand support
          </a>
        </div>
      </div>
    </div>
  )
}
