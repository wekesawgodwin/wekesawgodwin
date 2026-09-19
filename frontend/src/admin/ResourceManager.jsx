import { useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { adminApi } from '../api'
import { invalidate, useApi } from '../hooks/useApi'
import { Empty, ErrorState, Loading } from '../components/ui'
import { Field, Modal, PageHead, useToast } from './common'

function initialValues(fields, item) {
  return Object.fromEntries(fields.map((f) => [f.name, item ? (item[f.name] ?? '') : (f.default ?? (f.type === 'checkbox' ? false : ''))]))
}

/** Generic list + create/edit/delete screen for the simple ordered resources (skills, services, projects). */
export default function ResourceManager({ config }) {
  const { title, subtitle, path, singular, fields, columns } = config
  const list = useApi(`/api${path}`, { cache: false })
  const toast = useToast()
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const open = (item) => {
    setEditing(item)
    setValues(initialValues(fields, item === 'new' ? null : item))
    setError('')
  }
  const close = () => setEditing(null)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    // An emptied optional number input would fail validation; fall back to its default.
    const payload = Object.fromEntries(
      fields.map((f) => [f.name, f.type === 'number' && values[f.name] === '' ? (f.default ?? 0) : values[f.name]]),
    )
    try {
      if (editing === 'new') await adminApi.post(path, payload)
      else await adminApi.put(`${path}/${editing.id}`, payload)
      invalidate(`/api${path}`)
      list.reload()
      toast(`${singular} saved`)
      close()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item[columns[0].key]}"? This can't be undone.`)) return
    try {
      await adminApi.del(`${path}/${item.id}`)
      invalidate(`/api${path}`)
      list.reload()
      toast(`${singular} deleted`)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHead title={title} subtitle={subtitle}>
        <button type="button" className="btn sm" onClick={() => open('new')}>
          <FiPlus /> Add {singular.toLowerCase()}
        </button>
      </PageHead>

      {list.loading && <Loading height={60} count={4} className="" />}
      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
      {list.data && !list.data.length && <Empty>No {title.toLowerCase()} yet. Add your first one.</Empty>}
      {list.data?.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.data.map((item) => (
                <tr key={item.id}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.truncate ? 'truncate' : ''}>
                      {c.render ? c.render(item[c.key], item) : item[c.key]}
                    </td>
                  ))}
                  <td>
                    <div className="actions">
                      <button type="button" className="icon-btn" onClick={() => open(item)} aria-label="Edit">
                        <FiEdit2 />
                      </button>
                      <button type="button" className="icon-btn danger" onClick={() => remove(item)} aria-label="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? `New ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}
          onClose={close}
          footer={
            <>
              <button type="button" className="btn sm outline" onClick={close}>
                Cancel
              </button>
              <button type="submit" form="resource-form" className="btn sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="resource-form" className="form-grid" onSubmit={save}>
            {fields.map((f) => (
              <Field key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
            ))}
            {error && <div className="alert error full">{error}</div>}
          </form>
        </Modal>
      )}
    </>
  )
}
