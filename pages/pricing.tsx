import React, { useState } from 'react'
import Link from 'next/link'
import { TRIAL_NUMBER } from '@/lib/env.client'

export default function PricingPage(){
  return (
    <main className="container py-16 text-center">
      <div className="section-label">Pricing</div>
      <h1>Peace of mind for one fixed price</h1>
      <p className="text-slate-600 mt-2">Cancel anytime. Introductory pricing may change in the future.</p>
      <div className="mt-8 max-w-3xl mx-auto">
        <PricingCard />
      </div>
    </main>
  )
}

function PricingCard(){
  const [annual,setAnnual] = useState(false)
  const priceMonthly = 29
  const priceAnnual = 348
  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start text-left">
      <div className="border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm uppercase text-[#FF5B04] font-semibold">Boroma Plan</div>
            <div className="text-2xl font-semibold mt-1">{annual ? 'Annual' : 'Monthly'}</div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <span>Bill monthly</span>
            <input type="checkbox" className="toggle" checked={annual} onChange={e=>setAnnual(e.target.checked)} />
            <span>Bill annually</span>
          </label>
        </div>

        <div className="mt-4">
          <div className="text-4xl font-semibold">
            ${annual ? priceAnnual : priceMonthly}
            <span className="text-base font-normal text-slate-500">/{annual ? 'yr' : 'mo'}</span>
          </div>

          <ul className="mt-4 space-y-2 text-slate-700">
            <li>• 24/7 phone-first tech help</li>
            <li>• Up to 10 calls/mo, 35 minutes each (25-min reminder)</li>
            <li>• Toll-free number for paid members</li>
            <li>• Fridge magnet print</li>
            <li>• SMS step-by-step recap after each call</li>
            <li>• Scam-aware guidance & guardrails</li>
            <li>• Multilingual — English, Spanish, Chinese</li>
          </ul>

          <div className="mt-6 flex gap-3">
            <a
              href={`/signup?plan=${annual ? 'annual' : 'monthly'}`}
              className="btn btn-primary hover:shadow-[0_0_18px_rgba(255,91,4,0.45)]"
            >
              Get 24/7 support now
            </a>
            <a href={`tel:${TRIAL_NUMBER}`} className="btn btn-outline">
              Try a call for free
            </a>
          </div>
        </div>
      </div>

      <aside className="border rounded-2xl p-6">
        <div className="text-sm uppercase text-[#FF5B04] font-semibold">Launch special — 40% off</div>
        <div className="mt-2">Use code: <span className="font-semibold">LAUNCH40</span></div>
        <div className="text-slate-600 mt-1">⏰ This pricing ends October 31st, 2025</div>
        <div className="text-slate-600 mt-1">New members after October pay $29/month</div>
      </aside>
    </div>
  )
}
