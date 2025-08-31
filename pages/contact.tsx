export default function Contact(){
  return (
    <main className="container py-16">
      <h1>Contact</h1>
      <p className="mt-2 text-slate-700">Email: support@boroma.io — Phone: {process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100'}</p>
      <form className="card p-6 mt-6 max-w-xl">
        <input className="w-full border rounded-xl p-3 mb-3" placeholder="Your name" required />
        <input className="w-full border rounded-xl p-3 mb-3" type="email" placeholder="Your email" required />
        <textarea className="w-full border rounded-xl p-3 mb-3" placeholder="How can we help?" rows={5} required />
        <button className="btn btn-primary">Send</button>
      </form>
    </main>
  )
}
