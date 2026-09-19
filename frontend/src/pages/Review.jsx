import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaStar } from 'react-icons/fa6'
import { FiCheckCircle, FiSend } from 'react-icons/fi'
import { api } from '../api'
import { invalidate, useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import PageBanner from '../components/PageBanner'
import { ErrorState, Loading } from '../components/ui'

export default function Review() {
  usePageMeta('Leave a review')
  const { token } = useParams()
  const invite = useApi(`/api/reviews/invite/${token}`, { cache: false })
  const [form, setForm] = useState({ name: '', role: '', rating: 5, content: '' })
  const [status, setStatus] = useState({ sending: false, error: '', done: false })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ sending: true, error: '', done: false })
    try {
      await api(`/api/reviews/invite/${token}`, { method: 'POST', body: form })
      invalidate('/api/reviews')
      setStatus({ sending: false, error: '', done: true })
    } catch (err) {
      setStatus({ sending: false, error: err.message, done: false })
    }
  }

  let body
  if (invite.loading) body = <Loading height={300} count={1} className="" />
  else if (invite.error) body = <ErrorState error={invite.error} onRetry={invite.reload} />
  else if (status.done)
    body = (
      <div className="state">
        <FiCheckCircle />
        <h3 style={{ marginTop: 10 }}>Thank you!</h3>
        <p>Your review has been submitted. I really appreciate you taking the time.</p>
        <Link to="/" className="btn" style={{ marginTop: 24 }}>
          Visit the site
        </Link>
      </div>
    )
  else if (!invite.data?.valid)
    body = (
      <div className="state error">
        <p>This review link is invalid or has already been used. If you think that&apos;s a mistake, please get in touch.</p>
        <Link to="/contact" className="btn outline" style={{ marginTop: 24 }}>
          Contact me
        </Link>
      </div>
    )
  else
    body = (
      <form onSubmit={submit} className="form-grid">
        <p className="full" style={{ margin: 0 }}>
          Thanks for working with me{invite.data.client_label ? ` on ${invite.data.client_label}` : ''}! Your honest
          feedback helps future clients, and it will be shown on this site.
        </p>
        <div className="field">
          <label htmlFor="r-name">Your name</label>
          <input id="r-name" required maxLength={120} value={form.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="r-role">
            Role / company <small>(optional)</small>
          </label>
          <input id="r-role" maxLength={150} value={form.role} onChange={set('role')} placeholder="CEO, Acme Ltd" />
        </div>
        <div className="field full">
          <span className="label" style={{ display: 'block', marginBottom: 8, fontFamily: 'var(--font-head)', color: '#fff', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14 }}>
            Rating
          </span>
          <div className="star-input" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={form.rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className={n <= form.rating ? 'on' : ''}
                onClick={() => setForm((f) => ({ ...f, rating: n }))}
              >
                <FaStar />
              </button>
            ))}
          </div>
        </div>
        <div className="field full">
          <label htmlFor="r-content">Your review</label>
          <textarea id="r-content" required maxLength={2000} value={form.content} onChange={set('content')} />
        </div>
        {status.error && <div className="alert error full">{status.error}</div>}
        <div className="full">
          <button className="btn" disabled={status.sending}>
            {status.sending ? 'Submitting…' : 'Submit review'} <FiSend />
          </button>
        </div>
      </form>
    )

  return (
    <>
      <PageBanner title="Leave a review" ghost="Review" crumbs={[{ label: 'Review' }]} />
      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          {body}
        </div>
      </section>
    </>
  )
}
