import Link from 'next/link'

// Render ONLY the three pledge cards (no heading here) so the section header in index.tsx
// is not duplicated. Keeps design clean and accessible.

export default function TrustPledge() {
  const items = [
    {
      title: 'No passwords, no OTPs',
      body: 'We never ask for secrets. Ever.',
    },
    {
      title: 'No screen sharing',
      body: 'Phone-first coaching, safer by default.',
    },
    {
      title: 'Consent and recaps',
      body: 'Calls may be recorded, and we send a written summary.',
    },
  ]

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl bg-white text-slate-900 p-6 shadow-sm">
          <div className="text-lg font-semibold">{it.title}</div>
          <p className="mt-2 text-slate-600">{it.body}</p>
        </div>
      ))}
    </div>
  )
}

