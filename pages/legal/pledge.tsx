import Head from 'next/head'

export default function ScamFreePledge() {
  return (
    <>
      <Head>
        <title>Scam-Free Pledge • Boroma</title>
        <meta name="description" content="Simple safety rules we follow on every call to protect seniors." />
      </Head>

      {/* Full-bleed background with proper top spacing so it never hides behind the navbar */}
      <section className="relative isolate">
        <div className="absolute inset-0 bg-[#FFF6EB]" />
        <main className="container relative z-10 mx-auto px-4 pt-28 pb-24 min-h-[80vh]">
          <header className="max-w-3xl mx-auto">
            <h1
              className="text-4xl md:text-5xl font-semibold leading-tight"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}
            >
              Scam-Free Pledge
            </h1>
            <p className="text-slate-700 mt-3">
              We know trust is earned. Boroma commits to the following safety rules on every call.
            </p>
          </header>

          <div className="max-w-3xl mx-auto mt-8 space-y-4 text-slate-800">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>No passwords, no OTP codes.</strong> We will never ask.</li>
              <li><strong>No screen sharing, no remote control.</strong> We teach by phone only.</li>
              <li><strong>Clear boundaries.</strong> We don’t access banking or payment accounts.</li>
              <li><strong>Consent.</strong> Calls may be recorded for training and safety, with notice.</li>
              <li><strong>Post-call recap.</strong> We send written steps so families can review.</li>
              <li><strong>Report concerns.</strong> Email <a className="text-[#FF5B04]" href="mailto:hello@boroma.site">hello@boroma.site</a> and we will investigate.</li>
            </ul>

            <p className="text-slate-700">
              This pledge is part of our Terms of Service.
            </p>
          </div>
        </main>
      </section>
    </>
  )
}
