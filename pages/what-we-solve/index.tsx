import Head from 'next/head'
import Link from 'next/link'
import { ISSUES } from '@/data/issues'

export default function WhatWeSolve() {
  return (
    <>
      <Head>
        <title>What we solve • Boroma</title>
        <meta
          name="description"
          content="Quick guides for the most common tech issues we handle on calls."
        />
      </Head>

      {/* Full-bleed smooth background + correct top spacing */}
      <section className="relative isolate">
        <div className="absolute inset-0 bg-[#FFF6EB]" />
        <main className="container relative z-10 mx-auto px-4 pt-28 pb-24 min-h-[80vh]">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide font-semibold text-[#FF5B04]">What we solve</div>
            <h1
              className="mx-auto font-semibold leading-tight mt-2"
              style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui', fontSize: '44px', maxWidth: '900px' }}
            >
              We cover most everyday issues, here are the popular ones
            </h1>
            <p className="text-slate-600 mt-3">
              Click through for quick guides and what a typical call includes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {ISSUES.map((it) => (
              <Link
                key={it.slug}
                href={`/what-we-solve/${it.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition"
              >
                <div className="font-semibold" style={{ fontFamily: 'Mona Sans, ui-sans-serif, system-ui' }}>
                  {it.title}
                </div>
                <div className="text-slate-500 text-sm mt-1">
                  {it.steps.length} steps • {it.time} min
                </div>
              </Link>
            ))}
          </div>
        </main>
      </section>
    </>
  )
}
