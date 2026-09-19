export function formatDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', opts)
}

export function readingTime(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || ''
}

export function splitList(value = '') {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// Wraps the last word of a heading in a <span> for the green accent.
export function accentLast(text = '') {
  const trimmed = text.trim()
  const i = trimmed.lastIndexOf(' ')
  if (i === -1) return { head: '', tail: trimmed }
  return { head: trimmed.slice(0, i + 1), tail: trimmed.slice(i + 1) }
}
