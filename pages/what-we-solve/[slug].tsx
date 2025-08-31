import { useRouter } from 'next/router'
import { getIssue } from '@/data/issues'
export default function IssuePage(){
  const { query } = useRouter()
  const issue = getIssue((query.slug as string)||'')
  if (!issue) return <main className="container py-16">Issue not found.</main>
  return (
    <main className="container py-16">
      <h1>{issue.title}</h1>
      <p className="text-slate-600 mt-2">{issue.short}</p>
      <h2 className="mt-8">What happens on a call</h2>
      <ul className="list-disc ml-6 mt-2 text-slate-700">{issue.bullets.map(b => <li key={b}>{b}</li>)}</ul>
      <h2 className="mt-8">Typical time</h2><p className="text-slate-700">{issue.time}</p>
      <h2 className="mt-8">Prep checklist</h2>
      <ul className="list-disc ml-6 mt-2 text-slate-700">
        <li>Have your phone and charger nearby</li>
        <li>Be near your router (for Wi‑Fi issues)</li>
        <li>Keep a pen if you want to note steps</li>
      </ul>
    </main>
  )
}
