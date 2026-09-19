import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { FiArrowLeft, FiArrowRight, FiCalendar, FiCheck, FiClock, FiLink, FiMessageSquare, FiSend } from 'react-icons/fi'
import { api } from '../api'
import { invalidate, useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import PageBanner from '../components/PageBanner'
import Prose from '../components/Prose'
import { ErrorState, Loading } from '../components/ui'
import { formatDate, initials, readingTime } from '../utils'
import { BlogSidebar } from './Blog'
import NotFound from './NotFound'

function Share({ title }) {
  const [copied, setCopied] = useState(false)
  const url = window.location.href
  const enc = encodeURIComponent
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked; nothing useful to do */
    }
  }
  return (
    <div className="share-row">
      <h5>Share this article</h5>
      <div className="socials">
        <a href={`https://x.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
          <FaXTwitter />
        </a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
          <FaLinkedinIn />
        </a>
        <button type="button" onClick={copy} aria-label="Copy link" title="Copy link">
          {copied ? <FiCheck /> : <FiLink />}
        </button>
      </div>
    </div>
  )
}

function CommentForm({ slug, onPosted }) {
  const [form, setForm] = useState({ name: '', content: '', website: '' })
  const [status, setStatus] = useState({ sending: false, error: '', ok: false })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ sending: true, error: '', ok: false })
    try {
      const comment = await api(`/api/posts/${slug}/comments`, { method: 'POST', body: form })
      setForm({ name: '', content: '', website: '' })
      setStatus({ sending: false, error: '', ok: true })
      onPosted(comment)
    } catch (err) {
      setStatus({ sending: false, error: err.message, ok: false })
    }
  }

  return (
    <form onSubmit={submit} className="form-grid" style={{ marginTop: 20 }}>
      <div className="field full">
        <label htmlFor="c-name">
          Name <small>(optional)</small>
        </label>
        <input id="c-name" value={form.name} onChange={set('name')} maxLength={100} placeholder="Anonymous" />
      </div>
      <div className="field full">
        <label htmlFor="c-content">Comment</label>
        <textarea id="c-content" required value={form.content} onChange={set('content')} maxLength={3000} placeholder="Share your thoughts…" />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>
      {status.error && <div className="alert error full">{status.error}</div>}
      {status.ok && <div className="alert success full">Thanks! Your comment has been posted.</div>}
      <div className="full">
        <button className="btn" disabled={status.sending}>
          {status.sending ? 'Posting…' : 'Post comment'} <FiSend />
        </button>
      </div>
    </form>
  )
}

export default function BlogPost() {
  const { slug } = useParams()
  const { data: post, loading, error, reload } = useApi(`/api/posts/${slug}`)
  const list = useApi('/api/posts')
  const [comments, setComments] = useState([])
  usePageMeta(post?.title || 'Blog', post?.excerpt)

  useEffect(() => {
    setComments(post?.comments || [])
  }, [post])

  if (loading && !post) {
    return (
      <>
        <PageBanner title="Blog" crumbs={[{ label: 'Blog', to: '/blog' }]} />
        <section className="section">
          <div className="container">
            <Loading height={420} count={1} className="" />
          </div>
        </section>
      </>
    )
  }
  if (error?.status === 404) return <NotFound />
  if (error && !post) {
    return (
      <section className="section" style={{ paddingTop: 200 }}>
        <div className="container">
          <ErrorState error={error} onRetry={reload} />
        </div>
      </section>
    )
  }
  if (!post) return null

  const posts = list.data || []
  const i = posts.findIndex((p) => p.slug === slug)
  const newer = i > 0 ? posts[i - 1] : null
  const older = i >= 0 ? posts[i + 1] : null

  const onPosted = (comment) => {
    setComments((c) => [...c, comment])
    invalidate('/api/posts')
  }

  return (
    <>
      <PageBanner title={post.title} ghost="Blog" crumbs={[{ label: 'Blog', to: '/blog' }, { label: post.title }]} />
      <section className="section">
        <div className="container blog-layout">
          <article>
            {post.cover_image_url && (
              <div className="article-cover">
                <img src={post.cover_image_url} alt="" />
              </div>
            )}
            <div className="post-meta" style={{ fontSize: 14, marginBottom: 26 }}>
              <span>
                <FiCalendar /> {formatDate(post.published_at, { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span>
                <FiClock /> {readingTime(post.content)} min read
              </span>
              <span>
                <FiMessageSquare /> {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>
            <Prose>{post.content}</Prose>
            <Share title={post.title} />

            {(newer || older) && (
              <nav className="post-nav" aria-label="More posts">
                {older && (
                  <Link to={`/blog/${older.slug}`}>
                    <small>
                      <FiArrowLeft /> Previous post
                    </small>
                    <strong>{older.title}</strong>
                  </Link>
                )}
                {newer && (
                  <Link to={`/blog/${newer.slug}`} className="next">
                    <small>
                      Next post <FiArrowRight />
                    </small>
                    <strong>{newer.title}</strong>
                  </Link>
                )}
              </nav>
            )}

            <section className="comments" aria-labelledby="comments-title">
              <h3 id="comments-title">
                Comments ({comments.length})
              </h3>
              {comments.map((c) => (
                <div key={c.id} className="comment">
                  <div className="avatar" aria-hidden="true">
                    {initials(c.name || 'Anonymous')}
                  </div>
                  <h5>{c.name || 'Anonymous'}</h5>
                  <small>{formatDate(c.created_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                  <p>{c.content}</p>
                </div>
              ))}
              <h3 style={{ marginTop: 50 }}>Leave a comment</h3>
              <CommentForm slug={slug} onPosted={onPosted} />
            </section>
          </article>
          <BlogSidebar currentSlug={slug} />
        </div>
      </section>
    </>
  )
}
