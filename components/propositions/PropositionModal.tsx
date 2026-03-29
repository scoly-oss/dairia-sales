'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Proposition, Service } from '@/lib/types'

interface Item {
  id?: string
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
  total_price: number
  sort_order: number
}

interface Props {
  proposition: Proposition | null
  prospects: Array<{ id: string; company_name: string }>
  services: Service[]
  onSave: (p: Proposition) => void
  onClose: () => void
}

export default function PropositionModal({ proposition, prospects, services, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    title: proposition?.title || '',
    prospect_id: proposition?.prospect_id || '',
    status: proposition?.status || 'brouillon',
    conditions: proposition?.conditions || '',
    valid_until: proposition?.valid_until || '',
  })
  const [items, setItems] = useState<Item[]>(
    proposition?.items?.map((i, idx) => ({
      id: i.id,
      service_id: i.service_id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.total_price,
      sort_order: idx,
    })) || [{ service_id: null, description: '', quantity: 1, unit_price: 0, total_price: 0, sort_order: 0 }]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalAmount = items.reduce((s, i) => s + i.total_price, 0)

  function updateItem(idx: number, field: keyof Item, value: string | number) {
    setItems((prev) => {
      const next = [...prev]
      const item = { ...next[idx], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        item.total_price = Number(item.quantity) * Number(item.unit_price)
      }
      if (field === 'service_id' && value) {
        const svc = services.find((s) => s.id === value)
        if (svc) {
          item.description = svc.name
          item.unit_price = svc.unit_price || svc.hourly_rate || 0
          item.total_price = item.quantity * item.unit_price
        }
      }
      next[idx] = item
      return next
    })
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { service_id: null, description: '', quantity: 1, unit_price: 0, total_price: 0, sort_order: prev.length },
    ])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.prospect_id) {
      setError('Titre et client requis.')
      return
    }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      title: form.title.trim(),
      prospect_id: form.prospect_id,
      status: form.status as Proposition['status'],
      conditions: form.conditions || null,
      valid_until: form.valid_until || null,
      total_amount: totalAmount,
      updated_at: new Date().toISOString(),
    }

    let propId = proposition?.id
    if (propId) {
      const { error } = await supabase.from('propositions').update(payload).eq('id', propId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase
        .from('propositions')
        .insert({ ...payload, created_by: user?.id, created_at: new Date().toISOString() })
        .select()
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      propId = data.id
    }

    // Upsert items
    if (proposition?.id) {
      await supabase.from('proposition_items').delete().eq('proposition_id', propId!)
    }
    if (items.length > 0) {
      await supabase.from('proposition_items').insert(
        items.map((item, idx) => ({
          proposition_id: propId,
          service_id: item.service_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          sort_order: idx,
        }))
      )
    }

    // Fetch updated proposition
    const { data: updated } = await supabase
      .from('propositions')
      .select('*, prospect:prospects(id, company_name), items:proposition_items(*)')
      .eq('id', propId!)
      .single()

    onSave(updated as Proposition)
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
        className="rounded-[14px] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: '#1e2d3d' }}>
            {proposition ? 'Modifier la proposition' : 'Nouvelle proposition'}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: '#6b7280' }} /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Titre *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Proposition de services" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Client *</label>
              <select value={form.prospect_id} onChange={(e) => setForm((f) => ({ ...f, prospect_id: e.target.value }))}
                className={inputCls} style={inputStyle}>
                <option value="">Sélectionner...</option>
                {prospects.map((p) => (
                  <option key={p.id} value={p.id}>{p.company_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Statut</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                className={inputCls} style={inputStyle}>
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="acceptee">Acceptée</option>
                <option value="refusee">Refusée</option>
                <option value="expiree">Expirée</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Valide jusqu'au</label>
              <input type="date" value={form.valid_until}
                onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                className={inputCls} style={inputStyle} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#6b7280' }}>Prestations</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Description prestation"
                        className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number" value={item.quantity} min="0.01" step="0.01"
                        onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Qté"
                        className="w-full px-2 py-1.5 rounded-lg text-xs outline-none text-center"
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number" value={item.unit_price} min="0" step="10"
                        onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="Prix unit."
                        className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-xs font-semibold" style={{ color: '#e8842c' }}>
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(idx)}>
                    <Trash2 size={14} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem}
              className="mt-2 flex items-center gap-1 text-xs font-medium"
              style={{ color: '#e8842c' }}>
              <Plus size={13} /> Ajouter une ligne
            </button>
          </div>

          {/* Total */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ backgroundColor: '#fff7ed' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>Total HT</span>
            <span className="text-xl font-bold" style={{ color: '#e8842c' }}>
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Conditions</label>
            <textarea value={form.conditions}
              onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
              rows={2} placeholder="Conditions de paiement, délais..."
              className={inputCls} style={inputStyle} />
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
