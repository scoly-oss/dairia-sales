'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Prospect } from '@/lib/types'

interface ProspectModalProps {
  prospect: Prospect | null
  onSave: (p: Prospect) => void
  onClose: () => void
}

export default function ProspectModal({ prospect, onSave, onClose }: ProspectModalProps) {
  const [form, setForm] = useState({
    company_name: prospect?.company_name || '',
    siren: prospect?.siren || '',
    sector: prospect?.sector || '',
    size: prospect?.size || '',
    website: prospect?.website || '',
    address: prospect?.address || '',
    score: prospect?.score || 'froid',
    notes: prospect?.notes || '',
    tags: prospect?.tags?.join(', ') || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim()) {
      setError('Le nom de l\'entreprise est requis.')
      return
    }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      company_name: form.company_name.trim(),
      siren: form.siren || null,
      sector: form.sector || null,
      size: form.size || null,
      website: form.website || null,
      address: form.address || null,
      score: form.score as Prospect['score'],
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
    }

    let result
    if (prospect?.id) {
      const { data, error } = await supabase
        .from('prospects')
        .update(payload)
        .eq('id', prospect.id)
        .select('*, contacts(*), deals(id, stage, amount)')
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      result = data
    } else {
      const { data, error } = await supabase
        .from('prospects')
        .insert({ ...payload, created_by: user?.id, created_at: new Date().toISOString() })
        .select('*, contacts(*), deals(id, stage, amount)')
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      result = data
    }

    onSave(result as Prospect)
    setSaving(false)
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
        className="rounded-[14px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: '#1e2d3d' }}>
            {prospect ? 'Modifier le prospect' : 'Nouveau prospect'}
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
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
              Entreprise *
            </label>
            <input name="company_name" value={form.company_name} onChange={handleChange}
              placeholder="ACME SAS" className={inputCls} style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>SIREN</label>
              <input name="siren" value={form.siren} onChange={handleChange}
                placeholder="123 456 789" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Score</label>
              <select name="score" value={form.score} onChange={handleChange}
                className={inputCls} style={inputStyle}>
                <option value="froid">🔵 Froid</option>
                <option value="tiede">🟠 Tiède</option>
                <option value="chaud">🔴 Chaud</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Secteur</label>
              <input name="sector" value={form.sector} onChange={handleChange}
                placeholder="Finance, Tech, Santé..." className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Taille</label>
              <select name="size" value={form.size} onChange={handleChange}
                className={inputCls} style={inputStyle}>
                <option value="">Non renseignée</option>
                <option value="TPE">TPE (1-9)</option>
                <option value="PME">PME (10-249)</option>
                <option value="ETI">ETI (250-4999)</option>
                <option value="GE">GE (5000+)</option>
                <option value="Startup">Startup</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Site web</label>
            <input name="website" value={form.website} onChange={handleChange}
              placeholder="https://www.exemple.fr" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Adresse</label>
            <input name="address" value={form.address} onChange={handleChange}
              placeholder="123 rue de la Paix, 75001 Paris" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Tags (séparés par virgule)</label>
            <input name="tags" value={form.tags} onChange={handleChange}
              placeholder="startup, tech, urgent" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={3} placeholder="Notes internes..." className={inputCls} style={inputStyle} />
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
