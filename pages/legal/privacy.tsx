export default function Privacy(){
  return (
    <main className="container py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="text-slate-600 mt-3 max-w-3xl">
        Your trust matters. This policy explains what we collect, how we use it, and your choices.
      </p>

      <section className="mt-6 text-slate-700 space-y-4 max-w-3xl">
        <h2 className="text-xl font-semibold mt-6">What we collect</h2>
        <p>
          We collect only what’s needed to provide the service: your phone number, basic account/profile information,
          call metadata (time, duration), call recordings and transcripts for up to 30 days, and short issue descriptions.
        </p>

        <h2 className="text-xl font-semibold mt-6">How we use it</h2>
        <p>
          We use your information to provide and improve support, deliver call summaries to designated family members,
          ensure quality and safety, prevent fraud and abuse, and manage billing.
        </p>

        <h2 className="text-xl font-semibold mt-6">Family summaries</h2>
        <p>
          Sending summaries to family is a core feature. You can choose which family member(s) receive summaries and can
          change recipients at any time.
        </p>

        <h2 className="text-xl font-semibold mt-6">No selling of data</h2>
        <p>
          We never sell your information to third parties. We may share limited data with service providers who help us
          operate Boroma (e.g., telephony, cloud hosting, payments). They are bound by contracts to protect your data and
          use it only to provide services to us.
        </p>

        <h2 className="text-xl font-semibold mt-6">Recordings and security</h2>
        <p>
          Calls may be recorded and transcribed for quality and safety. Recordings are encrypted at rest and in transit
          and kept for up to 30 days, then deleted. While no method is perfect, we work hard to protect your information.
        </p>

        <h2 className="text-xl font-semibold mt-6">Your choices</h2>
        <p>
          You can request a copy of your data, correct it, or ask us to delete it at any time. To make a request, email
          <a href="mailto:hello@boroma.site" className="text-[#FF5B04] font-medium"> hello@boroma.site</a>.
        </p>

        <h2 className="text-xl font-semibold mt-6">Children</h2>
        <p>
          Boroma is for adults. If we learn that a child under 13 has provided personal information, we will delete it.
        </p>

        <h2 className="text-xl font-semibold mt-6">International transfers</h2>
        <p>
          Depending on your location, your data may be processed in countries with different data protection laws.
          By using Boroma, you consent to these transfers as needed to provide the service.
        </p>

        <h2 className="text-xl font-semibold mt-6">Updates</h2>
        <p>
          We may update this policy from time to time. If we make material changes, we will notify you by email or in-app.
        </p>

        <h2 className="text-xl font-semibold mt-6">Contact</h2>
        <p>
          Questions about privacy? Email <a href="mailto:hello@boroma.site" className="text-[#FF5B04] font-medium">hello@boroma.site</a>.
        </p>
      </section>
    </main>
  )
}
