import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FiUpload, FiX } from 'react-icons/fi'
import { adminApi } from '../api'

// ---------- Toasts ----------
const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef()
  const show = useCallback((message, kind = 'success') => {
    clearTimeout(timer.current)
    setToast({ message, kind })
    timer.current = setTimeout(() => setToast(null), 3500)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className={`toast ${toast.kind}`} role="status">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

// ---------- Layout bits ----------
export function PageHead({ title, subtitle, children }) {
  return (
    <div className="admin-top">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="button-row">{children}</div>}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

// ---------- Form fields ----------
export function ImageInput({ id, value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const media = await adminApi.upload('/media', file)
      onChange(media.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <div className="image-field">
        <input id={id} type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload an image" />
        <button type="button" className="btn sm outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <FiUpload /> {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(e) => upload(e.target.files[0])} />
      </div>
      {error && <span className="hint" style={{ color: 'var(--danger)' }}>{error}</span>}
      {value && <img className="image-preview" src={value} alt="" />}
    </>
  )
}

/**
 * Renders one field from a config object:
 * { name, label, type: text|textarea|number|url|email|checkbox|select|image, required, hint, options, full }
 */
export function Field({ field, value, onChange }) {
  const id = `f-${field.name}`
  const common = { id, required: field.required, maxLength: field.maxLength, placeholder: field.placeholder }
  let input
  switch (field.type) {
    case 'textarea':
      input = <textarea {...common} rows={field.rows || 5} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      break
    case 'number':
      input = (
        <input {...common} type="number" min={field.min} max={field.max} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
      )
      break
    case 'checkbox':
      return (
        <div className={`field${field.full ? ' full' : ''}`}>
          <label className="check" htmlFor={id} style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-body)', fontSize: 15 }}>
            <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
            {field.label}
          </label>
          {field.hint && <span className="hint">{field.hint}</span>}
        </div>
      )
    case 'select':
      input = (
        <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case 'image':
      input = <ImageInput id={id} value={value} onChange={onChange} />
      break
    default:
      input = <input {...common} type={field.type || 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  }
  return (
    <div className={`field${field.full ? ' full' : ''}`}>
      <label htmlFor={id}>
        {field.label}
        {!field.required && field.type !== 'checkbox' && <small> (optional)</small>}
      </label>
      {input}
      {field.hint && <span className="hint">{field.hint}</span>}
    </div>
  )
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
