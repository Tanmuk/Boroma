import Link from 'next/link'
import Head from 'next/head'
import { BLOG_POSTS } from '@/data/posts'

export default function BlogIndex(){
  const posts = BLOG_POSTS
  return (
    <main className="container py-16">
      <Head>
        <title>Safety & Support Blog — Boroma</title>
        <meta name="description" content="Plain-English tips to keep seniors safe online, plus how Boroma protects your family." />
      </Head>

      <h1>Safety & Support Blog</h1>
      <p className="text-slate-600 mt-2 max-w-2xl">Clear guidance on avoiding tech support scams and getting the most from on-demand help.</p>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {posts.map(p => (
          <article key={p.slug} className="card p-6">
            <div className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</div>
            <h3 className="mt-1"><Link href={`/blog/${p.slug}`}>{p.title}</Link></h3>
            <p className="text-slate-600 mt-2">{p.description}</p>
            <div className="mt-4">
              <Link className="btn btn-outline" href={`/blog/${p.slug}`}>Read more</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
