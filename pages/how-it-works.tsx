export default function How(){
  return (
    <main className="container py-16">
      <h1>How it works</h1>
      <ol className="mt-6 space-y-6 text-slate-700">
        <li className="card p-6"><b>Call our number.</b> Tell us your issue in plain English.</li>
        <li className="card p-6"><b>We guide step-by-step.</b> Simple instructions at your pace.</li>
        <li className="card p-6"><b>SMS recap.</b> We text the steps so you can do it again later.</li>
      </ol>
      <h2 className="mt-12">What we don’t do</h2>
      <ul className="list-disc ml-6 mt-4 text-slate-700">
        <li>We never ask for passwords or one-time codes.</li>
        <li>We don’t log in to your accounts or control your device.</li>
      </ul>
      <h2 className="mt-12">Languages</h2>
      <p className="text-slate-700 mt-2">English at launch. Spanish coming soon.</p>
    </main>
  )
}
