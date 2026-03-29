'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Task, Profile } from '@/lib/types'

interface Props {
  task: Task | null
  prospects: Array<{ id: string; company_name: string }>
  profiles: Array<{ id: string; name: string | null; email: string }>
  currentUser: Profile
  onSave: (t: Task) => void
  onClose: () => void
}

export default function TaskModal({ task, prospects, profiles, currentUser, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    due_date: task?.due_date || '',
    status: task?.status || 'a_faire',
    priority: task?.priority || 'normale',
    prospect_id: task?.prospect_id || '',
    assigned_to: task?.assigned_to || currentUser.id,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Le titre est requis.'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      due_date: form.due_date || null,
      status: form.status as Task['status'],
      priority: form.priority as Task['priority'],
      prospect_id: form.prospect_id || null,
      assigned_to: form.assigned_to || null,
      updated_at: new Date().toISOString(),
    }

    let result
    if (task?.id) {
      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', task.id)
        .select('*, prospect:prospects(id, company_name)')
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      result = data
    } else {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...payload, created_by: currentUser.id, created_at: new Date().toISOString() })
        .select('*, prospect:prospects(id, company_name)')
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      result = data
    }

    onSave(result as Task)
    setSaving(false)
  }

  // Quick sequence buttons
  async function addSequence(days: number) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setForm((f) => ({ ...f, due_date: d.toISOString().split('T')[0] }))
  }

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none"
  const inputStyle = { border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#ffffff' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-[14px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: '#1e2d3d' }}>
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: '#6b7280' }} /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Titre *</label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="Relance mail..." className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Prospect</label>
            <select name="prospect_id" value={form.prospect_id} onChange={handleChange}
              className={inputCls} style={inputStyle}>
              <option value="">Aucun</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>{p.company_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Priorité</label>
              <select name="priority" value={form.priority} onChange={handleChange}
                className={inputCls} style={inputStyle}>
                <option value="faible">Faible</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Statut</label>
              <select name="status" value={form.status} onChange={handleChange}
                className={inputCls} style={inputStyle}>
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="fait">Fait</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Date d'échéance</label>
            <input name="due_date" type="date" value={form.due_date} onChange={handleChange}
              className={inputCls} style={inputStyle} />
            {/* Quick sequence */}
            <div className="flex gap-1 mt-1.5">
              {[3, 7, 15, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => addSequence(d)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
                >
                  J+{d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Assigné à</label>
            <select name="assigned_to" value={form.assigned_to} onChange={handleChange}
              className={inputCls} style={inputStyle}>
              <option value="">Non assigné</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={2} placeholder="Détails..." className={inputCls} style={inputStyle} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}>
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#e8842c', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
