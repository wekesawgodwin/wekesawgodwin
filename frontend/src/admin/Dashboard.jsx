import { Link } from 'react-router-dom'
import { FiAward, FiBriefcase, FiEdit3, FiFileText, FiLayers, FiMail, FiMessageSquare, FiPlus, FiStar } from 'react-icons/fi'
import { ErrorState, Loading } from '../components/ui'
import { PageHead } from './common'

export default function Dashboard({ stats }) {
  const s = stats.data
  const tiles = s && [
    { to: '/admin/messages', icon: <FiMail />, label: 'Messages', value: s.messages, extra: s.unread_messages ? `${s.unread_messages} unread` : '' },
    { to: '/admin/projects', icon: <FiBriefcase />, label: 'Projects', value: s.projects },
    { to: '/admin/posts', icon: <FiEdit3 />, label: 'Blog posts', value: s.posts },
    { to: '/admin/comments', icon: <FiMessageSquare />, label: 'Comments', value: s.comments },
    { to: '/admin/reviews', icon: <FiStar />, label: 'Reviews', value: s.reviews },
    { to: '/admin/skills', icon: <FiAward />, label: 'Skills', value: s.skills },
    { to: '/admin/services', icon: <FiLayers />, label: 'Services', value: s.services },
    { to: '/admin/resume', icon: <FiFileText />, label: 'Resume', value: s.has_resume ? 'Yes' : 'No', extra: s.has_resume ? '' : 'upload one' },
  ]

  return (
    <>
      <PageHead title="Dashboard" subtitle="Everything on wekesawgodwin.com, in one place.">
        <Link to="/admin/posts/new" className="btn sm">
          <FiPlus /> New post
        </Link>
        <Link to="/admin/projects" className="btn sm outline">
          <FiPlus /> Add project
        </Link>
      </PageHead>

      {stats.loading && !s && <Loading height={110} count={8} className="stat-tiles" />}
      {stats.error && !s && <ErrorState error={stats.error} onRetry={stats.reload} />}
      {tiles && (
        <div className="stat-tiles">
          {tiles.map((t) => (
            <Link key={t.label} to={t.to} className="stat-tile">
              <span className="k">
                {t.icon} {t.label}
              </span>
              <div className="v">
                {t.value}
                {t.extra && <small>{t.extra}</small>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="panel-card">
        <h2>Getting started</h2>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
          <li>
            Fill in your <Link to="/admin/profile" className="text-green">profile</Link>: bio, photo, contact details and social links.
          </li>
          <li>
            Replace the starter <Link to="/admin/skills" className="text-green">skills</Link> and{' '}
            <Link to="/admin/services" className="text-green">services</Link> with your own.
          </li>
          <li>
            Add <Link to="/admin/projects" className="text-green">projects</Link> with cover images (upload them right from the form).
          </li>
          <li>
            Upload your <Link to="/admin/resume" className="text-green">resume</Link> to enable the “Download CV” buttons.
          </li>
          <li>
            After finishing a job, create a <Link to="/admin/reviews" className="text-green">review link</Link> and send it to your client.
          </li>
        </ol>
      </div>
    </>
  )
}
