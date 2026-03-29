'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, Globe, MapPin, Hash, Phone, Mail, User, Plus,
  Trash2, ChevronLeft, MessageSquare, PhoneCall, CalendarDays, FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  scoreBadgeClass, scoreLabel, formatDate, formatDateRelative,
  formatCurrency, stageLabel, stageColor, sanitizeUrl
} from '@/lib/utils'
import type { Prospect, Contact, Interaction, Deal, Profile } from '@/lib/types'

interface Props {
  prospect: Prospect
  currentUser: Profile
  profiles: Array<{ id: string; name: string | null; email: string }>
}

const TABS = ['Informations', 'Contacts', 'Interactions', 'Deals'] as const
type Tab = typeof TABS[number]

const INTERACTION_ICONS: Record<string, React.ElementType> = {
  appel: PhoneCall,
  email: Mail,
  meeting: CalendarDays,
  note: MessageSquare,
  autre: FileText,
}

export default function ProspectDetail({ prospect: initial, currentUser, profiles }: Props) {
  const [prospect, setProspect] = useState(initial)
  const [tab, setTab] = useState<Tab>('Informations')
  const [showContactForm, setShowContactForm] = useState(false)
  const [showInteractionForm, setShowInteractionForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', function: '', is_primary: false })
  const [interactionForm, setInteractionForm] = useState({ type: 'note', notes: '', date: new Date().toISOString().slice(0, 16) })
  const [saving, setSaving] = useState(false)

  async function saveContact(e: React.FormEvent) {
    e.preventDefault()
    if (!contactForm.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        prospect_id: prospect.id,
        name: contactForm.name.trim(),
        email: contactForm.email || null,
        phone: contactForm.phone || null,
        function: contactForm.function || null,
        is_primary: contactForm.is_primary,
      })
      .select()
      .single()
    if (!error && data) {
      setProspect((p) => ({ ...p, contacts: [...(p.contacts || []), data as Contact] }))
      setContactForm({ name: '', email: '', phone: '', function: '', is_primary: false })
      setShowContactForm(false)
    }
    setSaving(false)
  }

  async function deleteContact(id: string) {
    if (!confirm('Supprimer ce contact ?')) return
    const supabase = createClient()
    await supabase.from('contacts').delete().eq('id', id)
    setProspect((p) => ({ ...p, contacts: p.contacts?.filter((c) => c.id !== id) }))
  }

  async function saveInteraction(e: React.FormEvent) {
    e.preventDefault()
    if (!interactionForm.notes.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        prospect_id: prospect.id,
        type: interactionForm.type,
        notes: interactionForm.notes.trim(),
        date: new Date(interactionForm.date).toISOString(),
        created_by: currentUser.id,
      })
      .select('*, profile:profiles(name)')
      .single()
    if (!error && data) {
      setProspect((p) => ({
        ...p,
        interactions: [data as Interaction, ...(p.interactions || [])],
      }))
      setInteractionForm({ type: 'note', notes: '', date: new Date().toISOString().slice(0, 16) })
      setShowInteractionForm(false)
    }
    setSaving(false)
  }

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none"
  const inputStyle = { border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#ffffff' }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Back + header */}
      <div className="flex items-start gap-4 mb-6">
        <Link
          href="/prospects"
          className="flex items-center gap-1 text-sm mt-1"
          style={{ color: '#6b7280' }}
        >
          <ChevronLeft size={16} /> Retour
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold" style={{ color: '#1e2d3d' }}>
              {prospect.company_name}
            </h2>
            <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${scoreBadgeClass(prospect.score)}`}>
              {scoreLabel(prospect.score)}
            </span>
            {prospect.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#f0f0ee', color: '#6b7280' }}
              >
                {tag}
              </span>
            ))}
          </div>
          {prospect.sector && (
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
              {prospect.sector} {prospect.size && `· ${prospect.size}`}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ backgroundColor: '#f0f0ee' }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t ? '#ffffff' : 'transparent',
              color: tab === t ? '#1e2d3d' : '#6b7280',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Informations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {[
            { icon: Building2, label: 'Entreprise', value: prospect.company_name },
            { icon: Hash, label: 'SIREN', value: prospect.siren },
            { icon: Globe, label: 'Site web', value: sanitizeUrl(prospect.website), isLink: true },
            { icon: MapPin, label: 'Adresse', value: prospect.address },
          ].map(({ icon: Icon, label, value, isLink }) => (
            <div
              key={label}
              className="p-4 rounded-[14px]"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
            >
              <p className="text-xs font-medium mb-1 flex items-center gap-1.5" style={{ color: '#6b7280' }}>
                <Icon size={13} /> {label}
              </p>
              {isLink && value ? (
                <a href={value} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium" style={{ color: '#e8842c' }}>
                  {value}
                </a>
              ) : (
                <p className="text-sm font-medium" style={{ color: value ? '#1e2d3d' : '#9ca3af' }}>
                  {value || '—'}
                </p>
              )}
            </div>
          ))}
          {prospect.notes && (
            <div
              className="p-4 rounded-[14px] md:col-span-2"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>Notes</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#1e2d3d' }}>{prospect.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Contacts' && (
        <div className="max-w-2xl space-y-3">
          {(prospect.contacts || []).map((contact) => (
            <div
              key={contact.id}
              className="flex items-start gap-3 p-4 rounded-[14px]"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: '#e8842c' }}
              >
                {contact.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>
                    {contact.name}
                  </p>
                  {contact.is_primary && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: '#fff7ed', color: '#e8842c' }}
                    >
                      Principal
                    </span>
                  )}
                </div>
                {contact.function && (
                  <p className="text-xs" style={{ color: '#6b7280' }}>{contact.function}</p>
                )}
                <div className="flex items-center gap-4 mt-1.5">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`}
                      className="text-xs flex items-center gap-1" style={{ color: '#6b7280' }}>
                      <Mail size={11} /> {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`}
                      className="text-xs flex items-center gap-1" style={{ color: '#6b7280' }}>
                      <Phone size={11} /> {contact.phone}
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => deleteContact(contact.id)}>
                <Trash2 size={14} style={{ color: '#ef4444' }} />
              </button>
            </div>
          ))}

          {showContactForm ? (
            <form onSubmit={saveContact} className="p-4 rounded-[14px] space-y-3"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e8842c' }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Nom *</label>
                  <input value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Fonction</label>
                  <input value={contactForm.function}
                    onChange={(e) => setContactForm((f) => ({ ...f, function: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Email</label>
                  <input type="email" value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Téléphone</label>
                  <input type="tel" value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm" style={{ color: '#1e2d3d' }}>
                <input type="checkbox" checked={contactForm.is_primary}
                  onChange={(e) => setContactForm((f) => ({ ...f, is_primary: e.target.checked }))} />
                Contact principal
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowContactForm(false)}
                  className="px-4 py-1.5 rounded-lg text-sm" style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-sm text-white"
                  style={{ backgroundColor: '#e8842c' }}>
                  Ajouter
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowContactForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full justify-center"
              style={{ border: '1px dashed #e5e5e3', color: '#6b7280' }}
            >
              <Plus size={15} /> Ajouter un contact
            </button>
          )}
        </div>
      )}

      {tab === 'Interactions' && (
        <div className="max-w-2xl space-y-3">
          {showInteractionForm ? (
            <form onSubmit={saveInteraction} className="p-4 rounded-[14px] space-y-3"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e8842c' }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Type</label>
                  <select value={interactionForm.type}
                    onChange={(e) => setInteractionForm((f) => ({ ...f, type: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    <option value="note">Note</option>
                    <option value="appel">Appel</option>
                    <option value="email">Email</option>
                    <option value="meeting">Réunion</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Date</label>
                  <input type="datetime-local" value={interactionForm.date}
                    onChange={(e) => setInteractionForm((f) => ({ ...f, date: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Notes *</label>
                <textarea value={interactionForm.notes}
                  onChange={(e) => setInteractionForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3} className={inputCls} style={inputStyle} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowInteractionForm(false)}
                  className="px-4 py-1.5 rounded-lg text-sm" style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-sm text-white"
                  style={{ backgroundColor: '#e8842c' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowInteractionForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full justify-center mb-2"
              style={{ backgroundColor: '#e8842c', color: '#ffffff' }}
            >
              <Plus size={15} /> Ajouter une interaction
            </button>
          )}

          {/* Timeline */}
          {(prospect.interactions || [])
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((interaction) => {
              const Icon = INTERACTION_ICONS[interaction.type] || MessageSquare
              return (
                <div key={interaction.id} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#fff7ed', color: '#e8842c' }}
                  >
                    <Icon size={14} />
                  </div>
                  <div
                    className="flex-1 p-3 rounded-[14px]"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold capitalize" style={{ color: '#e8842c' }}>
                        {interaction.type}
                      </span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>
                        {formatDateRelative(interaction.date)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#1e2d3d' }}>
                      {interaction.notes}
                    </p>
                    {interaction.profile && (
                      <p className="text-xs mt-1.5" style={{ color: '#6b7280' }}>
                        Par {interaction.profile.name}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          {(prospect.interactions || []).length === 0 && !showInteractionForm && (
            <p className="text-sm text-center py-8" style={{ color: '#6b7280' }}>
              Aucune interaction enregistrée.
            </p>
          )}
        </div>
      )}

      {tab === 'Deals' && (
        <div className="max-w-2xl space-y-3">
          {(prospect.deals || []).map((deal) => (
            <div
              key={deal.id}
              className="flex items-center gap-4 p-4 rounded-[14px]"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: stageColor(deal.stage) }}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>{deal.title}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  {stageLabel(deal.stage)} · {deal.probability}%
                </p>
              </div>
              <p className="text-sm font-bold" style={{ color: '#e8842c' }}>
                {formatCurrency(deal.amount)}
              </p>
            </div>
          ))}
          {(prospect.deals || []).length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: '#6b7280' }}>Aucun deal associé.</p>
          )}
        </div>
      )}
    </div>
  )
}
