'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { stageToProbability } from '@/lib/utils'
import type { Deal, DealStage, DealSource } from '@/lib/types'

interface DealModalProps {
  deal: Deal | null
  profiles: Array<{ id: string; name: string | null; email: string }>
  onSave: (deal: Deal) => void
  onClose: () => void
}

export default function DealModal({ deal, profiles, onSave, onClose }: DealModalProps) {
  const [form, setForm] = useState({
    title: deal?.title || '',
    prospect_id: deal?.prospect_id || '',
    amount: deal?.amount?.toString() || '0',
    stage: deal?.stage || 'prospect' as DealStage,
    probability: deal?.probability?.toString() || '10',
    source: deal?.source || '' as DealSource | '',
    assigned_to: deal?.assigned_to || '',
    notes: deal?.notes || '',
  })
  const [prospects, setProspects] = useState<Array<{ id: string; company_name: string }>>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProspects() {
      const supabase = createClient()
      const { data } = await supabase
        .from('prospects')
        .select('id, company_name')
        .order('company_name')
      setProspects(data || [])
    }
    loadProspects()
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm((f) => {
      const next = { ...f, [name]: value }
      if (name === 'stage') {
        next.probability = stageToProbability(value as DealStage).toString()
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.prospect_id) {
      setError('Le titre et le prospect sont requis.')
      return
    }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const payload = {
      title: form.title.trim(),
      prospect_id: form.prospect_id,
      amount: parseFloat(form.amount) || 0,
      stage: form.stage,
      probability: parseInt(form.probability) || 0,
      source: form.source || null,
      assigned_to: form.assigned_to || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }

    let result
    if (deal?.id) {
      const { data, error } = await supabase
        .from('deals')
        .update(payload)
        .eq('id', deal.id)
        .select('*, prospect:prospects(id, company_name, score)')
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      result = data
    } else {
      const { data, error } = await supabase
        .from('deals')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select('*, prospect:prospects(id, company_name, score)')
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      result = data
    }

    onSave(result as Deal)
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
            {deal ? 'Modifier le deal' : 'Nouveau deal'}
          </h2>
          <button onClick={onClose}>
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
              Titre *
            </label>
            <input
              name="title" value={form.title} onChange={handleChange}
              placeholder="Ex: Accompagnement contentieux 2024"
              className={inputCls} style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
              Prospect *
            </label>
            <select
              name="prospect_id" value={form.prospect_id} onChange={handleChange}
              className={inputCls} style={inputStyle}
            >
              <option value="">Sélectionner un prospect</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>{p.company_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                Montant (€)
              </label>
              <input
                name="amount" type="number" value={form.amount} onChange={handleChange}
                min="0" step="100" className={inputCls} style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                Probabilité (%)
              </label>
              <input
                name="probability" type="number" value={form.probability} onChange={handleChange}
                min="0" max="100" className={inputCls} style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                Étape
              </label>
              <select
                name="stage" value={form.stage} onChange={handleChange}
                className={inputCls} style={inputStyle}
              >
                <option value="prospect">Prospect</option>
                <option value="qualification">Qualification</option>
                <option value="proposition">Proposition</option>
                <option value="negociation">Négociation</option>
                <option value="gagne">Gagné</option>
                <option value="perdu">Perdu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                Source
              </label>
              <select
                name="source" value={form.source} onChange={handleChange}
                className={inputCls} style={inputStyle}
              >
                <option value="">Inconnue</option>
                <option value="referral">Recommandation</option>
                <option value="website">Site web</option>
                <option value="linkedin">LinkedIn</option>
                <option value="cold_call">Prospection</option>
                <option value="event">Événement</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
              Assigné à
            </label>
            <select
              name="assigned_to" value={form.assigned_to} onChange={handleChange}
              className={inputCls} style={inputStyle}
            >
              <option value="">Non assigné</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
              Notes
            </label>
            <textarea
              name="notes" value={form.notes} onChange={handleChange}
              rows={3} placeholder="Notes internes..."
              className={inputCls} style={inputStyle}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
            >
              Annuler
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#e8842c', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
