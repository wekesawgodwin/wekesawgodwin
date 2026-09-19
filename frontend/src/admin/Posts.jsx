import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiEdit2, FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi'
import { adminApi } from '../api'
import { invalidate, useApi } from '../hooks/useApi'
import Prose from '../components/Prose'
import { Empty, ErrorState, Loading } from '../components/ui'
import { formatDate } from '../utils'
import { Field, PageHead, useToast } from './common'

export function PostList() {
  const posts = useApi('/api/admin/posts', { auth: true })
  const toast = useToast()

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}" and its comments? This can't be undone.`)) return
    try {
      await adminApi.del(`/posts/${post.id}`)
      invalidate('/api/posts')
      posts.reload()
      toast('Post deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHead title="Blog posts" subtitle="Write in Markdown. Drafts stay private until you publish them.">
        <Link to="/admin/posts/new" className="btn sm">
          <FiPlus /> New post
        </Link>
      </PageHead>
      {posts.loading && <Loading height={60} count={4} className="" />}
      {posts.error && <ErrorState error={posts.error} onRetry={posts.reload} />}
      {posts.data && !posts.data.length && <Empty>No posts yet. Write your first one!</Empty>}
      {posts.data?.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Published</th>
                <th>Comments</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {posts.data.map((p) => (
                <tr key={p.id}>
                  <td className="truncate">
                    <Link to={`/admin/posts/${p.id}`}>{p.title}</Link>
                  </td>
                  <td>{p.published ? <span className="badge green">Published</span> : <span className="badge">Draft</span>}</td>
                  <td>{formatDate(p.published_at) || '—'}</td>
                  <td>{p.comment_count}</td>
                  <td>
                    <div className="actions">
                      {p.published && (
                        <a className="icon-btn" href={`/blog/${p.slug}`} target="_blank" rel="noopener" aria-label="View">
                          <FiExternalLink />
                        </a>
                      )}
                      <Link className="icon-btn" to={`/admin/posts/${p.id}`} aria-label="Edit">
                        <FiEdit2 />
                      </Link>
                      <button type="button" className="icon-btn danger" onClick={() => remove(p)} aria-label="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

const EMPTY = { title: '', slug: '', excerpt: '', content: '', cover_image_url: '', published: false }

export function PostEditor() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const toast = useToast()
  const existing = useApi(isNew ? null : `/api/admin/posts/${id}`, { auth: true })
  const [values, setValues] = useState(isNew ? EMPTY : null)
  const [tab, setTab] = useState('write')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing.data) {
      const { title, slug, excerpt, content, cover_image_url, published } = existing.data
      setValues({ title, slug, excerpt, content, cover_image_url, published })
    }
  }, [existing.data])

  const set = (key) => (v) => setValues((s) => ({ ...s, [key]: v }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = isNew ? await adminApi.post('/posts', values) : await adminApi.put(`/posts/${id}`, values)
      invalidate('/api/posts')
      toast(saved.published ? 'Post saved and published' : 'Draft saved')
      if (isNew) navigate(`/admin/posts/${saved.id}`, { replace: true })
      else setValues((s) => ({ ...s, slug: saved.slug }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />
  if (!values) return <Loading height={500} count={1} className="" />

  return (
    <>
      <PageHead title={isNew ? 'New post' : 'Edit post'}>
        <Link to="/admin/posts" className="btn sm outline">
          <FiArrowLeft /> All posts
        </Link>
        {!isNew && values.published && (
          <a href={`/blog/${values.slug}`} target="_blank" rel="noopener" className="btn sm outline">
            View <FiExternalLink />
          </a>
        )}
      </PageHead>
      <form className="panel-card form-grid" onSubmit={save}>
        <Field field={{ name: 'title', label: 'Title', required: true, maxLength: 200, full: true }} value={values.title} onChange={set('title')} />
        <Field
          field={{ name: 'slug', label: 'URL slug', maxLength: 220, hint: 'Leave blank to generate from the title.' }}
          value={values.slug}
          onChange={set('slug')}
        />
        <Field field={{ name: 'excerpt', label: 'Excerpt', maxLength: 500, hint: 'Shown on blog cards and in search results.' }} value={values.excerpt} onChange={set('excerpt')} />
        <Field field={{ name: 'cover_image_url', label: 'Cover image', type: 'image', full: true }} value={values.cover_image_url} onChange={set('cover_image_url')} />

        <div className="field full editor">
          <label htmlFor="f-content">Content (Markdown)</label>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'write'} className={tab === 'write' ? 'active' : ''} onClick={() => setTab('write')}>
              Write
            </button>
            <button type="button" role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>
              Preview
            </button>
          </div>
          {tab === 'write' ? (
            <textarea
              id="f-content"
              required
              value={values.content}
              onChange={(e) => set('content')(e.target.value)}
              placeholder={'## A heading\n\nSome **bold** text, a [link](https://example.com), and a list:\n\n- one\n- two'}
            />
          ) : (
            <div className="preview">
              <Prose>{values.content || '*Nothing to preview yet.*'}</Prose>
            </div>
          )}
        </div>

        <Field field={{ name: 'published', label: 'Published (visible on the site)', type: 'checkbox', full: true }} value={values.published} onChange={set('published')} />
        {error && <div className="alert error full">{error}</div>}
        <div className="full">
          <button className="btn" disabled={saving}>
            {saving ? 'Saving…' : values.published ? 'Save & publish' : 'Save draft'}
          </button>
        </div>
      </form>
    </>
  )
}
