import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiMail, FiMapPin, FiPhone, FiSend } from 'react-icons/fi'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../SiteContext'
import PageBanner from '../components/PageBanner'
import { Reveal, SectionTitle, Socials } from '../components/ui'

const EMPTY = { name: '', email: '', subject: '', body: '', service_id: '', website: '' }

export default function Contact() {
  usePageMeta('Contact', 'Get in touch about a project, a job opportunity, or just to say hello.')
  const { profile } = useSite()
  const services = useApi('/api/services')
  const [params] = useSearchParams()
  const [form, setForm] = useState(() => ({ ...EMPTY, service_id: params.get('service') || '' }))
  const [status, setStatus] = useState({ sending: false, error: '', ok: '' })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ sending: true, error: '', ok: '' })
    try {
      const res = await api('/api/contact', {
        method: 'POST',
        body: { ...form, service_id: form.service_id ? Number(form.service_id) : null },
      })
      setForm(EMPTY)
      setStatus({ sending: false, error: '', ok: res.detail })
    } catch (err) {
      setStatus({ sending: false, error: err.message, ok: '' })
    }
  }

  const cards = [
    profile.location && { icon: <FiMapPin />, title: 'Location', body: <p>{profile.location}</p> },
    profile.phone && {
      icon: <FiPhone />,
      title: 'Phone',
      body: <a href={`tel:${profile.phone.replace(/\s+/g, '')}`}>{profile.phone}</a>,
    },
    profile.email && {
      icon: <FiMail />,
      title: 'Email',
      body: <a href={`mailto:${profile.email}`}>{profile.email}</a>,
    },
  ].filter(Boolean)

  return (
    <>
      <PageBanner title="Contact" crumbs={[{ label: 'Contact' }]} />
      <section className="section">
        <div className="container">
          {cards.length > 0 && (
            <div className="contact-cards">
              {cards.map((c, i) => (
                <Reveal key={c.title} className="contact-card" delay={i * 120}>
                  <div className="icon">{c.icon}</div>
                  <h4>{c.title}</h4>
                  {c.body}
                </Reveal>
              ))}
            </div>
          )}

          <div className="contact-layout">
            <Reveal>
              <SectionTitle ghost="Contact" label="Get in touch">
                Let&apos;s build something <span>great</span>
              </SectionTitle>
              <p>
                Have a project in mind, a role you think I&apos;d be a great fit for, or just a question?
                Send me a message and I&apos;ll get back to you as soon as I can, usually within a day.
              </p>
              <span className="availability">Available for new projects</span>
              <div style={{ marginTop: 34 }}>
                <Socials profile={profile} email />
              </div>
            </Reveal>

            <Reveal delay={120}>
              <form onSubmit={submit} className="form-grid">
                <div className="field">
                  <label htmlFor="name">Your name</label>
                  <input id="name" value={form.name} onChange={set('name')} maxLength={120} autoComplete="name" required />
                </div>
                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <input id="email" type="email" value={form.email} onChange={set('email')} maxLength={200} autoComplete="email" required />
                </div>
                <div className="field">
                  <label htmlFor="subject">Subject</label>
                  <input id="subject" value={form.subject} onChange={set('subject')} maxLength={200} />
                </div>
                <div className="field">
                  <label htmlFor="service">
                    Service <small>(optional)</small>
                  </label>
                  <select id="service" value={form.service_id} onChange={set('service_id')}>
                    <option value="">General enquiry</option>
                    {(services.data || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="body">Message</label>
                  <textarea id="body" value={form.body} onChange={set('body')} maxLength={5000} required placeholder="Tell me about your project…" />
                </div>
                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </div>
                {status.error && <div className="alert error full" role="alert">{status.error}</div>}
                {status.ok && <div className="alert success full" role="status">{status.ok}</div>}
                <div className="full">
                  <button className="btn" disabled={status.sending}>
                    {status.sending ? 'Sending…' : 'Send message'} <FiSend />
                  </button>
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
