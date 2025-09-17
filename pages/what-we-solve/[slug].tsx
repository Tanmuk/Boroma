import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getIssueBySlug, ISSUES } from '@/data/issues'

export default function IssuePage() {
  const router = useRouter()
  const slug = (router.query.slug as string) || ''
  const issue = getIssueBySlug(slug)

  if (!issue) {
    return (
      <section className="relative isolate">
        <div className="absolute inset-0 bg-[#FFF6EB]" />
        <main className="container relative z-10 mx-auto px-4 pt-28 pb-24 min-h-[80vh]">
          <h1
            className="text-3xl md:text-4xl font-semibold"
            style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}
          >
            Not found
          </h1>
          <p className="mt-3 text-slate-600">This guide doesn’t exist.</p>
          <div className="mt-6">
            <Link href="/what-we-solve" className="text-[#FF5B04] underline">Back to What we solve</Link>
          </div>
        </main>
      </section>
    )
  }

  const checklist =
    issue.checklist ??
    ['Have your phone and charger nearby', 'Be near your Wi-Fi router if relevant', 'Keep a pen if you want to note steps']

  return (
    <>
      <Head>
        <title>{issue.title} • Boroma</title>
        <meta name="description" content={`${issue.title} — quick call guide`} />
      </Head>

      <section className="relative isolate">
        <div className="absolute inset-0 bg-[#FFF6EB]" />
        <main className="container relative z-10 mx-auto px-4 pt-28 pb-24 min-h-[80vh]">
          <header className="max-w-4xl">
            {/* Smaller than homepage header */}
            <h1
              className="font-semibold leading-tight"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '44px' }}
            >
              {issue.title}
            </h1>
            <div className="text-slate-600 mt-1">
              {issue.steps.length} steps • {issue.time} min
            </div>
          </header>

          <div className="mt-10 grid lg:grid-cols-2 gap-10">
            <section>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                What happens on a call
              </h2>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-800">
                {issue.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </section>

            <aside>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                Prep checklist
              </h2>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-800">
                {checklist.map((c, i) => <li key={i}>{c}</li>)}
              </ul>

              <div className="mt-8">
                <h3 className="text-xl font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                  Typical time
                </h3>
                <p className="text-slate-700 mt-1">{issue.time} minutes</p>
              </div>
            </aside>
          </div>

          <div className="mt-10">
            <Link href="/what-we-solve" className="text-[#FF5B04] underline">← Back to What we solve</Link>
          </div>
        </main>
      </section>
    </>
  )
}
