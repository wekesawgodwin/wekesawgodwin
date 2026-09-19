import { Link } from 'react-router-dom'

export default function PageBanner({ title, ghost, crumbs = [] }) {
  return (
    <section className="page-banner">
      <span className="hero-ghost" aria-hidden="true">
        {ghost || title}
      </span>
      <div className="container">
        <h1>{title}</h1>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} style={{ display: 'contents' }}>
              <span className="sep">/</span>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span className="current">{c.label}</span>}
            </span>
          ))}
        </nav>
      </div>
    </section>
  )
}
