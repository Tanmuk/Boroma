export default function Pricing(){
  const annual = 243
  return (
    <main className="container py-16">
      <h1>Simple pricing</h1>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="card p-8">
          <h3 className="mb-2">Unlimited Support</h3>
          <div className="text-4xl font-semibold">$29<span className="text-base font-normal text-slate-500">/mo</span></div>
          <div className="text-sm text-slate-500">or ${annual}/year (save 30%)</div>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>• 24/7 phone-first tech help</li>
            <li>• SMS step-by-step recaps</li>
            <li>• Scam-aware guidance & guardrails</li>
            <li>• Covers the most common issues</li>
          </ul>
          <a href="/signup" className="btn btn-primary mt-6">Start now</a>
          <p className="mt-4 text-xs text-slate-500">Fair-use: friendly reminder at 25 minutes; call ends at 35 minutes.</p>
        </div>
        <div className="card p-8">
          <h3 className="mb-2">What’s included</h3>
          <ul className="space-y-2 text-slate-700">
            <li>• English at launch (Spanish coming)</li>
            <li>• Works on any phone—no apps</li>
            <li>• Patient, plain-English guidance</li>
            <li>• SMS recaps you can follow later</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
