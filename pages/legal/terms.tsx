import Head from 'next/head'
import Link from 'next/link'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service • Boroma</title>
        <meta name="description" content="Terms of Service for Boroma." />
      </Head>

      <section className="relative isolate">
        <div className="absolute inset-0 bg-[#FFF6EB]" />
        <main className="container relative z-10 mx-auto px-4 pt-28 pb-24 min-h-[80vh]">
          <header className="max-w-3xl mx-auto">
            <h1
              className="text-4xl md:text-5xl font-semibold leading-tight"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}
            >
              Terms of Service
            </h1>
            <p className="text-slate-700 mt-3">Effective: 2025</p>
          </header>

          <article className="max-w-3xl mx-auto mt-8 space-y-7 text-slate-800">
            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Service</h2>
              <p>
                Boroma provides phone-based technology support designed for seniors. Members receive access to our
                toll-free line and agent assistance for common device issues.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Plans & Limits</h2>
              <p>
                Paid members receive up to 10 calls per month, up to 35 minutes each. A spoken reminder is provided at
                25 minutes. Unused minutes don’t roll over. We may offer a one-time free trial call per phone number.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Billing</h2>
              <p>
                Subscriptions renew automatically until canceled. You can manage or cancel anytime from the customer
                portal. Fees are non-refundable unless required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Safety</h2>
              <p>
                We never ask for passwords, OTPs, banking credentials, or remote device access. See our{' '}
                <Link href="/scam-free-pledge" className="text-[#FF5B04]">Scam-Free Pledge</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Recordings</h2>
              <p>
                Calls may be recorded for quality and safety. Recordings are kept for up to 30 days, then deleted.
                You can request a copy while available.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Acceptable Use</h2>
              <p>
                Service is for lawful personal use related to common tech issues. We do not provide financial, medical,
                or legal advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Disclaimers</h2>
              <p>
                We aim to resolve most common issues but cannot guarantee resolution in all cases. The service is
                provided “as is” without warranties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Changes</h2>
              <p>
                We may update these Terms. If changes are material, we will notify you by email or in-app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Contact</h2>
              <p>
                Questions? Email <a className="text-[#FF5B04]" href="mailto:hello@boroma.site">hello@boroma.site</a>.
              </p>
            </section>
          </article>
        </main>
      </section>
    </>
  )
}
