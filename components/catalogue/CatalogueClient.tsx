'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Service, ServiceCategory } from '@/lib/types'

const CATEGORIES: ServiceCategory[] = ['contentieux', 'conseil', 'conformite', 'formation', 'audit', 'autre']
const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  contentieux: 'Contentieux',
  conseil: 'Conseil',
  conformite: 'Conformité',
  formation: 'Formation',
  audit: 'Audit',
  autre: 'Autre',
}
const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  contentieux: '#ef4444',
  conseil: '#3b82f6',
  conformite: '#8b5cf6',
  formation: '#10b981',
  audit: '#f59e0b',
  autre: '#6b7280',
}

interface Props {
  initialServices: Service[]
}

const EMPTY_FORM = {
  name: '', category: 'conseil' as ServiceCategory, description: '',
  unit_price: '', hourly_rate: '', is_hourly: false,
}

export default function CatalogueClient({ initialServices }: Props) {
  const [services, setServices] = useState(initialServices)
  const [filterCat, setFilterCat] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filtered = services.filter((s) => !filterCat || s.category === filterCat)
  const grouped = CATEGORIES.reduce<Record<string, Service[]>>((acc, cat) => {
    acc[cat] = filtered.filter((s) => s.category === cat)
    return acc
  }, {})

  function openCreate() {
    setEditingService(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(service: Service) {
    setEditingService(service)
    setForm({
      name: service.name,
      category: service.category,
      description: service.description || '',
      unit_price: service.unit_price?.toString() || '',
      hourly_rate: service.hourly_rate?.toString() || '',
      is_hourly: service.is_hourly,
    })
    setShowModal(true)
  }

  async function deleteService(id: string) {
    if (!confirm('Supprimer cette prestation ?')) return
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)

    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description || null,
      unit_price: form.unit_price ? parseFloat(form.unit_price) : null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      is_hourly: form.is_hourly,
      updated_at: new Date().toISOString(),
    }

    if (editingService) {
      const { data } = await supabase.from('services').update(payload).eq('id', editingService.id).select().single()
      if (data) setServices((prev) => prev.map((s) => (s.id === editingService.id ? data as Service : s)))
    } else {
      const { data } = await supabase.from('services').insert({ ...payload, created_at: new Date().toISOString() }).select().single()
      if (data) setServices((prev) => [...prev, data as Service])
    }
    setSaving(false)
    setShowModal(false)
  }

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none"
  const inputStyle = { border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#ffffff' }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}
      >
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{ border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto"
          style={{ backgroundColor: '#e8842c' }}
        >
          <Plus size={15} /> Nouvelle prestation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {CATEGORIES.map((cat) => {
          const catServices = grouped[cat]
          if (filterCat && filterCat !== cat) return null
          if (catServices.length === 0 && !filterCat) return null
          return (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                <h3 className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>
                  {CATEGORY_LABELS[cat]}
                </h3>
                <span className="text-xs" style={{ color: '#6b7280' }}>({catServices.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {catServices.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} style={{ color: CATEGORY_COLORS[service.category] }} />
                        <h4 className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>{service.name}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(service)}>
                          <Pencil size={13} style={{ color: '#6b7280' }} />
                        </button>
                        <button onClick={() => deleteService(service.id)}>
                          <Trash2 size={13} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                    {service.description && (
                      <p className="text-xs mb-2" style={{ color: '#6b7280' }}>{service.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-auto">
                      {service.unit_price != null && !service.is_hourly && (
                        <span className="text-sm font-bold" style={{ color: '#e8842c' }}>
                          {formatCurrency(service.unit_price)} <span className="font-normal text-xs text-gray-500">forfait</span>
                        </span>
                      )}
                      {service.hourly_rate != null && service.is_hourly && (
                        <span className="text-sm font-bold" style={{ color: '#e8842c' }}>
                          {formatCurrency(service.hourly_rate)}<span className="font-normal text-xs">/h</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {catServices.length === 0 && (
                  <p className="text-sm col-span-3" style={{ color: '#6b7280' }}>Aucune prestation.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: '#ffffff' }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: '#1e2d3d' }}>
              {editingService ? 'Modifier la prestation' : 'Nouvelle prestation'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Nom *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Catégorie</label>
                <select value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))}
                  className={inputCls} style={inputStyle}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Description</label>
                <textarea value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} className={inputCls} style={inputStyle} />
              </div>
              <label className="flex items-center gap-2 text-sm" style={{ color: '#1e2d3d' }}>
                <input type="checkbox" checked={form.is_hourly}
                  onChange={(e) => setForm((f) => ({ ...f, is_hourly: e.target.checked }))} />
                Taux horaire
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Prix forfait (€)</label>
                  <input type="number" value={form.unit_price}
                    onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))}
                    className={inputCls} style={inputStyle} disabled={form.is_hourly} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Taux horaire (€/h)</label>
                  <input type="number" value={form.hourly_rate}
                    onChange={(e) => setForm((f) => ({ ...f, hourly_rate: e.target.value }))}
                    className={inputCls} style={inputStyle} disabled={!form.is_hourly} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg text-sm" style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#e8842c', opacity: saving ? 0.7 : 1 }}>
                  {saving ? '...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
