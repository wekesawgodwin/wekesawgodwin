import { useEffect, useState } from 'react'
import { adminApi } from '../api'
import { invalidate, useApi } from '../hooks/useApi'
import { useSite } from '../SiteContext'
import { ErrorState, Loading } from '../components/ui'
import { Field, PageHead, useToast } from './common'

const FIELDS = [
  { name: 'full_name', label: 'Full name', required: true, maxLength: 120 },
  { name: 'headline', label: 'Headline', maxLength: 200, hint: 'The big hero title. The last word is highlighted in green.' },
  { name: 'intro', label: 'Intro', type: 'textarea', rows: 3, full: true, hint: 'One or two sentences under the hero title.' },
  { name: 'about', label: 'About', type: 'textarea', rows: 7, full: true, hint: 'Your story. The first paragraph is shown on the home page.' },
  { name: 'avatar_url', label: 'Photo', type: 'image', full: true, hint: 'A square photo works best.' },
  { name: 'email', label: 'Public email', type: 'email', maxLength: 200 },
  { name: 'phone', label: 'Phone', maxLength: 50 },
  { name: 'location', label: 'Location', maxLength: 120 },
  { name: 'years_experience', label: 'Years of experience', type: 'number', min: 0, max: 80 },
  { name: 'github_url', label: 'GitHub URL', type: 'url', maxLength: 500 },
  { name: 'linkedin_url', label: 'LinkedIn URL', type: 'url', maxLength: 500 },
  { name: 'twitter_url', label: 'X / Twitter URL', type: 'url', maxLength: 500 },
]

export default function ProfileForm() {
  const profile = useApi('/api/profile', { cache: false })
  const { reloadProfile } = useSite()
  const toast = useToast()
  const [values, setValues] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile.data) setValues(profile.data)
  }, [profile.data])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = Object.fromEntries(FIELDS.map((f) => [f.name, values[f.name] ?? '']))
      if (body.years_experience === '') body.years_experience = 0
      await adminApi.put('/profile', body)
      invalidate('/api/profile')
      reloadProfile()
      toast('Profile saved')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead title="Profile" subtitle="Your name, bio, photo and contact details, used across the whole site." />
      {profile.loading && <Loading height={400} count={1} className="" />}
      {profile.error && <ErrorState error={profile.error} onRetry={profile.reload} />}
      {values && (
        <form className="panel-card form-grid" onSubmit={save}>
          {FIELDS.map((f) => (
            <Field key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
          ))}
          {error && <div className="alert error full">{error}</div>}
          <div className="full">
            <button className="btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
