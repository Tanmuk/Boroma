import Link from 'next/link'

export default function TrustPledge(){
  return (
    <section className="container py-14" id="safety">
      <div className="section-label text-center">Safety</div>
      <h2 className="mt-2 text-center">Our Scam-Free Pledge</h2>
      <p className="text-slate-600 mt-2 max-w-3xl mx-auto text-center">
        We protect seniors by design. Simple rules everyone can understand and check.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="card p-6">
          <h3>No passwords, no OTPs</h3>
          <p className="text-slate-600 mt-2">We never ask for secrets. Ever.</p>
        </div>
        <div className="card p-6">
          <h3>No screen sharing</h3>
          <p className="text-slate-600 mt-2">Phone-first coaching, safer by default.</p>
        </div>
        <div className="card p-6">
          <h3>Consent and recaps</h3>
          <p className="text-slate-600 mt-2">Calls may be recorded, and we send a written summary.</p>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link href="/legal/pledge" className="btn btn-outline">Read the full pledge</Link>
      </div>
    </section>
  )
}
