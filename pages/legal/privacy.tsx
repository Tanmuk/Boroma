import Head from 'next/head'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy • Boroma</title>
        <meta name="description" content="Privacy practices for Boroma." />
      </Head>

      <section className="relative isolate">
        <div className="absolute inset-0 bg-[#FFF6EB]" />
        <main className="container relative z-10 mx-auto px-4 pt-28 pb-24 min-h-[80vh]">
          <header className="max-w-3xl mx-auto">
            <h1
              className="text-4xl md:text-5xl font-semibold leading-tight"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}
            >
              Privacy Policy
            </h1>
            <p className="text-slate-700 mt-3">Effective: 2025</p>
          </header>

          <article className="max-w-3xl mx-auto mt-8 space-y-7 text-slate-800">
            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Data we collect</h2>
              <p>
                We collect only what’s needed to provide support: account details (name, email, phone), call metadata,
                brief issue descriptions, and call recordings (for quality and safety).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>How we use it</h2>
              <p>
                To deliver support, improve quality, prevent abuse, and send family summaries after each call (a core
                feature of the service).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Sharing</h2>
              <p>
                We don’t sell your data. We share with service providers (e.g., telephony, payments, hosting) under contracts
                that restrict their use to our instructions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Security & retention</h2>
              <p>
                Recordings are encrypted at rest and in transit and kept up to 30 days, then deleted. While no method is
                perfect, we work hard to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Your choices</h2>
              <p>
                You may request a copy, correction, or deletion of your data at any time by emailing{' '}
                <a className="text-[#FF5B04]" href="mailto:hello@boroma.site">hello@boroma.site</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Children</h2>
              <p>Boroma is for adults. If we learn that a child under 13 has provided personal information, we will delete it.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>International transfers</h2>
              <p>
                Depending on your location, data may be processed in other countries with different protections. By using
                Boroma, you consent to these transfers as needed to provide the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Updates</h2>
              <p>We may update this policy. If changes are material, we will notify you by email or in-app.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>Contact</h2>
              <p>
                Questions about privacy? Email <a className="text-[#FF5B04]" href="mailto:hello@boroma.site">hello@boroma.site</a>.
              </p>
            </section>
          </article>
        </main>
      </section>
    </>
  )
}
