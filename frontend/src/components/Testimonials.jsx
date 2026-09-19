import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa6'
import { initials } from '../utils'

export default function Testimonials({ reviews }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = reviews.length

  useEffect(() => {
    if (count < 2 || paused) return undefined
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 7000)
    return () => clearInterval(id)
  }, [count, paused])

  if (!count) return null
  const review = reviews[index % count]
  const go = (step) => setIndex((i) => (i + step + count) % count)

  return (
    <div
      className="testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <figure className="testimonial" key={review.id} aria-live="polite" style={{ margin: 0 }}>
        <div className="avatar" aria-hidden="true">
          {initials(review.name)}
        </div>
        <div className="stars" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: review.rating }, (_, i) => (
            <FaStar key={i} />
          ))}
        </div>
        <blockquote>“{review.content}”</blockquote>
        <figcaption>
          <cite>
            {review.name}
            {review.role && <span>{review.role}</span>}
          </cite>
        </figcaption>
      </figure>
      {count > 1 && (
        <div className="carousel-dots">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              type="button"
              className={i === index % count ? 'active' : ''}
              aria-label={`Show review ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
      {count > 1 && (
        <div className="carousel-nav">
          <button type="button" onClick={() => go(-1)} aria-label="Previous review">
            <FiChevronLeft />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next review">
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  )
}
