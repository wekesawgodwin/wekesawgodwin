import { Link } from 'react-router-dom'
import { FiArrowRight, FiCode, FiCompass, FiPenTool, FiSend } from 'react-icons/fi'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import PageBanner from '../components/PageBanner'
import { ServiceCard } from '../components/cards'
import Testimonials from '../components/Testimonials'
import { Empty, ErrorState, Loading, Reveal, SectionTitle } from '../components/ui'
import { CallToAction } from './Home'

const PROCESS = [
  {
    icon: <FiCompass />,
    title: 'Discover',
    text: 'We talk through your goals, users and constraints, and agree on scope, timeline and budget.',
  },
  {
    icon: <FiPenTool />,
    title: 'Design',
    text: 'I plan the architecture and data model and sketch the interface so there are no surprises later.',
  },
  {
    icon: <FiCode />,
    title: 'Build',
    text: 'Iterative development with regular demos, so you can see progress and steer as we go.',
  },
  {
    icon: <FiSend />,
    title: 'Launch',
    text: 'Deployment, domain and HTTPS setup, plus handover docs and support after go-live.',
  },
]

export default function Services() {
  usePageMeta('Services', 'Web application development, API engineering and deployment services.')
  const { data, loading, error, reload } = useApi('/api/services')
  const reviews = useApi('/api/reviews')

  return (
    <>
      <PageBanner title="Services" crumbs={[{ label: 'Services' }]} />
      <section className="section">
        <div className="container">
          <SectionTitle
            ghost="Services"
            label="What I offer"
            center
            text="From a first idea to a production-ready product, here is how I can help."
          >
            Services &amp; <span>Pricing</span>
          </SectionTitle>
          {loading && <Loading height={420} />}
          {error && !data && <ErrorState error={error} onRetry={reload} />}
          {data && !data.length && <Empty>Services will be listed here soon.</Empty>}
          {data?.length > 0 && (
            <div className="card-grid">
              {data.map((s, i) => (
                <Reveal key={s.id} delay={(i % 3) * 120}>
                  <ServiceCard
                    service={s}
                    showPrice
                    active={data.length >= 3 && i === 1}
                    action={
                      <Link to={`/contact?service=${s.id}`} className="btn sm">
                        Request this <FiArrowRight />
                      </Link>
                    }
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <SectionTitle ghost="Process" label="How I work">
            A simple, transparent <span>process</span>
          </SectionTitle>
          <div className="process-grid">
            {PROCESS.map((step, i) => (
              <Reveal key={step.title} delay={i * 120}>
                <div className="process-step">
                  <div className="icon">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {reviews.data?.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionTitle ghost="Reviews" label="Testimonials">
              Happy <span>clients</span>
            </SectionTitle>
            <Testimonials reviews={reviews.data} />
          </div>
        </section>
      )}
      <CallToAction />
    </>
  )
}
