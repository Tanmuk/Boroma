export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  readMinutes: number
  bodyHtml: string
  tags?: string[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "spot-tech-support-scams",
    title: "How to spot a tech support scam, seven red flags for families",
    description: "A quick checklist you can share with parents and grandparents.",
    date: "2025-08-30",
    readMinutes: 6,
    tags: ["safety","scams","family"],
    bodyHtml: `
      <p>Scammers prey on urgency and confusion. Share these red flags:</p>
      <ol class="list-decimal pl-5 space-y-2">
        <li>Asks for your <b>password</b> or <b>OTP code</b>.</li>
        <li>Wants to install “remote control” apps.</li>
        <li>Demands payment in gift cards or crypto.</li>
        <li>Claims to be “Microsoft/Apple support” but calls you first.</li>
        <li>Pop-up warnings that lock your screen and show a phone number.</li>
        <li>Refuses to send a written summary of the steps they took.</li>
        <li>Pushes you to stay on the line while paying.</li>
      </ol>
      <p>At Boroma, we avoid these traps: we <b>never</b> ask for passwords or OTPs,
      we do not screenshare or remote in, and we send a written recap after each call.</p>
    `
  },
  {
    slug: "boroma-scam-free-pledge",
    title: "The Boroma Scam-Free Pledge",
    description: "Our commitments to protect seniors and keep families in control.",
    date: "2025-08-30",
    readMinutes: 5,
    tags: ["pledge","trust","policy"],
    bodyHtml: `
      <ul class="list-disc pl-5 space-y-2">
        <li><b>No passwords, no OTPs:</b> we will never ask.</li>
        <li><b>No screen sharing:</b> we teach by phone, step by step.</li>
        <li><b>Clear boundaries:</b> we will not access banking or payments.</li>
        <li><b>Consent and accountability:</b> calls may be recorded for quality and safety.</li>
        <li><b>Report concerns:</b> email <a href="mailto:hello@boroma.site">hello@boroma.site</a> and we will investigate.</li>
      </ul>
      <p>This pledge is part of our Terms and is visible on every help page.</p>
    `
  },
  {
    slug: "avoid-remote-access-risks",
    title: "Why we avoid screen sharing and remote access",
    description: "Phone-first guidance reduces risk for seniors.",
    date: "2025-08-30",
    readMinutes: 4,
    tags: ["privacy","policy"],
    bodyHtml: `
      <p>Remote-access tools hand over complete control. That creates unnecessary risk.
      Our phone-first model removes that risk, keeps learning slower and safer,
      and builds confidence without exposing private data.</p>
      <p>If something truly needs hands-on support, we guide a trusted family member.</p>
    `
  },
  {
    slug: "suspect-a-scam-do-this",
    title: "Think someone is scamming your parent? Do this now",
    description: "A 10-minute response plan families can follow.",
    date: "2025-08-30",
    readMinutes: 5,
    tags: ["guide","checklist"],
    bodyHtml: `
      <ol class="list-decimal pl-5 space-y-2">
        <li>End the call politely. Do not argue.</li>
        <li>Turn off Wi-Fi on the device. Power down if needed.</li>
        <li>Change the password on the affected account from another device.</li>
        <li>Call the bank/card issuer fraud line if money was moved.</li>
        <li>Save any screenshots or caller IDs for later.</li>
        <li>Tell a family member so no one feels alone.</li>
        <li>Call Boroma. We’ll help review steps safely.</li>
      </ol>
    `
  },
  {
    slug: "how-boroma-keeps-calls-safe",
    title: "How Boroma keeps calls safe",
    description: "Verification, consent, and guardrails in plain English.",
    date: "2025-08-30",
    readMinutes: 5,
    tags: ["process","compliance"],
    bodyHtml: `
      <p>We combine product guardrails and human process:</p>
      <ul class="list-disc pl-5 space-y-2">
        <li><b>Phone-first workflow:</b> no remote tools, no device takeover.</li>
        <li><b>Member allowlist:</b> only approved numbers reach the toll-free line.</li>
        <li><b>Fair-use limits:</b> short reminders to keep calls focused.</li>
        <li><b>Post-call recaps:</b> written steps create transparency for families.</li>
        <li><b>Audit log:</b> calls and actions are logged to Supabase for review.</li>
      </ul>
    `
  }
]
