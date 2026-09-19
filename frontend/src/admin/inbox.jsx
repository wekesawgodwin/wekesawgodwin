import { useRef, useState } from 'react'
import { FaStar } from 'react-icons/fa6'
import { FiCheck, FiCopy, FiEye, FiEyeOff, FiFileText, FiLink, FiMail, FiTrash2, FiUpload } from 'react-icons/fi'
import { adminApi } from '../api'
import { invalidate, useApi } from '../hooks/useApi'
import { useSite } from '../SiteContext'
import { Empty, ErrorState, Loading } from '../components/ui'
import { formatDate } from '../utils'
import { PageHead, formatBytes, useToast } from './common'

const DATETIME = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }

function useCopy() {
  const toast = useToast()
  return async (text, what = 'Link') => {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${what} copied`)
    } catch {
      window.prompt('Copy this:', text)
    }
  }
}

function ListState({ query, empty }) {
  if (query.loading && !query.data) return <Loading height={70} count={3} className="" />
  if (query.error && !query.data) return <ErrorState error={query.error} onRetry={query.reload} />
  if (query.data && !query.data.length) return <Empty>{empty}</Empty>
  return null
}

// ---------- Comments ----------
export function Comments() {
  const comments = useApi('/api/admin/comments', { auth: true })
  const toast = useToast()

  const remove = async (c) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await adminApi.del(`/comments/${c.id}`)
      invalidate('/api/posts')
      comments.reload()
      toast('Comment deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHead title="Comments" subtitle="Comments are published immediately. Remove anything inappropriate here." />
      <ListState query={comments} empty="No comments yet." />
      {comments.data?.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Comment</th>
                <th>Name</th>
                <th>Post</th>
                <th>Date</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {comments.data.map((c) => (
                <tr key={c.id}>
                  <td className="truncate" title={c.content}>
                    {c.content}
                  </td>
                  <td>{c.name || <em>Anonymous</em>}</td>
                  <td className="truncate">{c.post_title}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</td>
                  <td>
                    <div className="actions">
                      <button type="button" className="icon-btn danger" onClick={() => remove(c)} aria-label="Delete">
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

// ---------- Messages ----------
export function Messages({ onChange }) {
  const messages = useApi('/api/admin/messages', { auth: true })
  const toast = useToast()

  const setRead = async (m, is_read) => {
    try {
      await adminApi.patch(`/messages/${m.id}`, { is_read })
      messages.reload()
      onChange?.()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name || m.email}?`)) return
    try {
      await adminApi.del(`/messages/${m.id}`)
      messages.reload()
      onChange?.()
      toast('Message deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHead title="Messages" subtitle="Enquiries sent through the contact form." />
      <ListState query={messages} empty="No messages yet. They'll show up here when someone uses the contact form." />
      {messages.data?.map((m) => (
        <details
          key={m.id}
          className={`message-item${m.is_read ? '' : ' unread'}`}
          onToggle={(e) => e.currentTarget.open && !m.is_read && setRead(m, true)}
        >
          <summary>
            <span className="dot" aria-label={m.is_read ? 'Read' : 'Unread'} />
            <span className="from">
              {m.name || m.email}
              <small>{m.subject || m.body.slice(0, 80)}</small>
            </span>
            <span className="when">{formatDate(m.created_at, DATETIME)}</span>
          </summary>
          <div className="message-body">
            <div className="post-meta" style={{ marginBottom: 14 }}>
              <span>
                <FiMail /> {m.email}
              </span>
              {m.service_title && <span className="badge green">{m.service_title}</span>}
            </div>
            {m.subject && <h4 style={{ fontSize: 17 }}>{m.subject}</h4>}
            <p>{m.body}</p>
            <div className="button-row">
              <a
                className="btn sm"
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Your message'}`)}`}
              >
                <FiMail /> Reply
              </a>
              <button type="button" className="btn sm outline" onClick={() => setRead(m, !m.is_read)}>
                {m.is_read ? <FiEyeOff /> : <FiEye />} Mark {m.is_read ? 'unread' : 'read'}
              </button>
              <button type="button" className="btn sm danger" onClick={() => remove(m)}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </details>
      ))}
    </>
  )
}

// ---------- Reviews ----------
export function Reviews() {
  const invites = useApi('/api/admin/invites', { auth: true })
  const reviews = useApi('/api/admin/reviews', { auth: true })
  const toast = useToast()
  const copy = useCopy()
  const [label, setLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const linkFor = (token) => `${window.location.origin}/review/${token}`

  const createInvite = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const invite = await adminApi.post('/invites', { client_label: label })
      setLabel('')
      invites.reload()
      copy(linkFor(invite.token), 'Review link')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const act = async (fn, message) => {
    try {
      await fn()
      invalidate('/api/reviews')
      invites.reload()
      reviews.reload()
      if (message) toast(message)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHead title="Reviews" subtitle="Send a one-time link to a client. Their review appears on your site automatically." />

      <div className="panel-card">
        <h2>Create a review link</h2>
        <form className="image-field" onSubmit={createInvite}>
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={150}
            placeholder="Client or project name (for your reference)"
            aria-label="Client or project name"
          />
          <button className="btn sm" disabled={creating}>
            <FiLink /> {creating ? 'Creating…' : 'Create link'}
          </button>
        </form>

        {invites.data?.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 20 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {invites.data.map((i) => (
                  <tr key={i.id}>
                    <td>{i.client_label || <em>Untitled</em>}</td>
                    <td>{i.used ? <span className="badge green">Review received</span> : <span className="badge">Waiting</span>}</td>
                    <td>{formatDate(i.created_at)}</td>
                    <td>
                      <div className="actions">
                        {!i.used && (
                          <button type="button" className="icon-btn" onClick={() => copy(linkFor(i.token), 'Review link')} aria-label="Copy link">
                            <FiCopy />
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn danger"
                          aria-label="Delete link"
                          onClick={() => window.confirm('Delete this link? Any review already left will be kept.') && act(() => adminApi.del(`/invites/${i.id}`), 'Link deleted')}
                        >
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
      </div>

      <div className="panel-card">
        <h2>Client reviews</h2>
        <ListState query={reviews} empty="No reviews yet." />
        {reviews.data?.map((r) => (
          <div key={r.id} className="message-item" style={{ padding: '18px 20px' }}>
            <div className="post-meta" style={{ marginBottom: 8 }}>
              <strong style={{ color: 'var(--white)', textTransform: 'none', fontSize: 16 }}>{r.name}</strong>
              {r.role && <span>{r.role}</span>}
              <span style={{ color: '#ffc53d', gap: 2 }}>
                {Array.from({ length: r.rating }, (_, n) => (
                  <FaStar key={n} style={{ color: '#ffc53d' }} />
                ))}
              </span>
              <span>{formatDate(r.created_at)}</span>
              {r.approved ? <span className="badge green">Visible</span> : <span className="badge red">Hidden</span>}
            </div>
            <p style={{ margin: '0 0 14px', whiteSpace: 'pre-line', color: 'var(--text-strong)' }}>{r.content}</p>
            <div className="button-row">
              <button type="button" className="btn sm outline" onClick={() => act(() => adminApi.patch(`/reviews/${r.id}`, { approved: !r.approved }), r.approved ? 'Review hidden' : 'Review visible')}>
                {r.approved ? <FiEyeOff /> : <FiEye />} {r.approved ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                className="btn sm danger"
                onClick={() => window.confirm('Delete this review permanently?') && act(() => adminApi.del(`/reviews/${r.id}`), 'Review deleted')}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ---------- Media ----------
function Dropzone({ accept, multiple, onFiles, children }) {
  const input = useRef()
  const [over, setOver] = useState(false)
  return (
    <div
      className={`dropzone${over ? ' over' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onFiles([...e.dataTransfer.files])
      }}
    >
      <FiUpload />
      {children}
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          onFiles([...e.target.files])
          e.target.value = ''
        }}
      />
    </div>
  )
}

export function MediaLibrary() {
  const media = useApi('/api/admin/media', { auth: true })
  const toast = useToast()
  const copy = useCopy()
  const [busy, setBusy] = useState(false)

  const upload = async (files) => {
    if (!files.length) return
    setBusy(true)
    let failed = 0
    for (const file of files) {
      try {
        await adminApi.upload('/media', file)
      } catch (err) {
        failed += 1
        toast(`${file.name}: ${err.message}`, 'error')
      }
    }
    setBusy(false)
    media.reload()
    if (!failed) toast(files.length === 1 ? 'Image uploaded' : `${files.length} images uploaded`)
  }

  const remove = async (m) => {
    if (!window.confirm(`Delete ${m.filename}? Anything using this image will show a broken picture.`)) return
    try {
      await adminApi.del(`/media/${m.id}`)
      media.reload()
      toast('Image deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHead title="Media" subtitle="Images for projects, posts and your profile. Stored in the database, so they survive redeploys." />
      <div className="panel-card">
        <Dropzone accept="image/png,image/jpeg,image/gif,image/webp" multiple onFiles={upload}>
          <strong style={{ color: 'var(--white)' }}>{busy ? 'Uploading…' : 'Drop images here or click to upload'}</strong>
          <span style={{ fontSize: 14 }}>PNG, JPEG, GIF or WebP, up to 5 MB each</span>
        </Dropzone>
      </div>
      <div className="panel-card">
        <ListState query={media} empty="No images uploaded yet." />
        {media.data?.length > 0 && (
          <div className="media-grid">
            {media.data.map((m) => (
              <div key={m.id} className="media-tile">
                <img src={m.url} alt={m.filename} loading="lazy" />
                <div className="info">
                  <div title={m.filename}>{m.filename}</div>
                  <small>{formatBytes(m.size)}</small>
                  <div className="actions">
                    <button type="button" className="icon-btn" onClick={() => copy(m.url, 'Image URL')} aria-label="Copy URL">
                      <FiCopy />
                    </button>
                    <button type="button" className="icon-btn danger" onClick={() => remove(m)} aria-label="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ---------- Resume ----------
export function ResumeManager() {
  const resume = useApi('/api/resume/meta', { cache: false })
  const { reloadResume } = useSite()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const refresh = () => {
    invalidate('/api/resume')
    resume.reload()
    reloadResume()
  }

  const upload = async ([file]) => {
    if (!file) return
    setBusy(true)
    try {
      await adminApi.upload('/resume', file)
      refresh()
      toast('Resume uploaded')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Remove your resume? The Download CV buttons will disappear.')) return
    try {
      await adminApi.del('/resume')
      refresh()
      toast('Resume removed')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHead title="Resume" subtitle="Visitors can download this from the Download CV buttons." />
      <div className="panel-card">
        {resume.loading && <Loading height={70} count={1} className="" />}
        {resume.data && (
          <div className="message-item" style={{ padding: '18px 20px', marginBottom: 20 }}>
            <div className="post-meta" style={{ margin: 0 }}>
              <span>
                <FiFileText /> <strong style={{ color: 'var(--white)', textTransform: 'none' }}>{resume.data.filename}</strong>
              </span>
              <span>{formatBytes(resume.data.size)}</span>
              <span>
                <FiCheck /> Uploaded {formatDate(resume.data.uploaded_at, DATETIME)}
              </span>
            </div>
            <div className="button-row" style={{ marginTop: 14 }}>
              <a className="btn sm outline" href="/api/resume" target="_blank" rel="noopener">
                <FiEye /> View
              </a>
              <button type="button" className="btn sm danger" onClick={remove}>
                <FiTrash2 /> Remove
              </button>
            </div>
          </div>
        )}
        <Dropzone accept="application/pdf" onFiles={upload}>
          <strong style={{ color: 'var(--white)' }}>
            {busy ? 'Uploading…' : resume.data ? 'Replace with a new PDF' : 'Upload your resume (PDF)'}
          </strong>
          <span style={{ fontSize: 14 }}>PDF up to 10 MB</span>
        </Dropzone>
      </div>
    </>
  )
}
