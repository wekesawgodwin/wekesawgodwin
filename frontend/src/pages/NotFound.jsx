import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFound() {
  usePageMeta('Page not found')
  return (
    <section className="not-found">
      <div>
        <div className="big">404</div>
        <h1 style={{ fontSize: 34, marginTop: 10 }}>Page not found</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link to="/" className="btn" style={{ marginTop: 20 }}>
          <FiArrowLeft /> Back home
        </Link>
      </div>
    </section>
  )
}
