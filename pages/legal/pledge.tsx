export default function Pledge(){
  return (
    <main className="container py-16">
      <h1>Scam-Free Pledge</h1>
      <p className="text-slate-600 mt-3 max-w-3xl">
        We know trust is earned. Boroma commits to the following safety rules on every call.
      </p>
      <ul className="mt-6 space-y-3 text-slate-700 list-disc pl-5">
        <li><b>No passwords, no OTP codes.</b> We will never ask.</li>
        <li><b>No screen sharing, no remote control.</b> We teach by phone only.</li>
        <li><b>Clear boundaries.</b> We don’t access banking or payment accounts.</li>
        <li><b>Consent.</b> Calls may be recorded for training and safety, with notice.</li>
        <li><b>Post-call recap.</b> We send written steps so families can review.</li>
        <li><b>Report concerns.</b> Email hello@boroma.site and we will investigate.</li>
      </ul>
      <p className="text-slate-600 mt-6">This pledge is part of our Terms of Service.</p>
    </main>
  )
}
