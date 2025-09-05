import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BLOG_POSTS } from '@/data/posts'

export default function BlogPostPage(){
  const router = useRouter()
  const { slug } = router.query as { slug?: string }
  const post = BLOG_POSTS.find(p => p.slug === slug)

  if (!post) {
    return (
      <main className="container py-16">
        <h1>Not found</h1>
        <p className="mt-2"><Link href="/blog">Back to blog</Link></p>
      </main>
    )
  }

  return (
    <main className="container py-16">
      <Head>
        <title>{post.title} — Boroma</title>
        <meta name="description" content={post.description} />
      </Head>

      <div className="text-xs text-slate-500">{new Date(post.date).toLocaleDateString()} • {post.readMinutes} min read</div>
      <h1 className="mt-1">{post.title}</h1>
      <article className="prose prose-slate mt-6 max-w-none"
        dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      <div className="mt-10">
        <Link className="btn btn-outline" href="/blog">Back to all posts</Link>
      </div>
    </main>
  )
}
