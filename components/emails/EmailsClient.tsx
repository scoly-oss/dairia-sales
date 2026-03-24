'use client'

import { useState } from 'react'
import { Plus, Send, Mail, FileText, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { EmailTemplate, EmailSent, Profile } from '@/lib/types'

const TAB_LABELS = ['Templates', 'Historique', 'Nouvel email'] as const
type Tab = typeof TAB_LABELS[number]

const CAT_LABELS: Record<string, string> = {
  prospection: 'Prospection',
  relance: 'Relance',
  proposition: 'Proposition',
  remerciement: 'Remerciement',
  autre: 'Autre',
}

interface Props {
  initialTemplates: EmailTemplate[]
  initialSentEmails: EmailSent[]
  prospects: Array<{ id: string; company_name: string }>
  currentUser: Profile
}

export default function EmailsClient({ initialTemplates, initialSentEmails, prospects, currentUser }: Props) {
  const [tab, setTab] = useState<Tab>('Templates')
  const [templates, setTemplates] = useState(initialTemplates)
  const [sentEmails, setSentEmails] = useState(initialSentEmails)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', body: '', category: 'autre' })
  const [sendForm, setSendForm] = useState({ prospect_id: '', to_email: '', subject: '', body: '', template_id: '' })
  const [saving, setSaving] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!templateForm.name || !templateForm.subject || !templateForm.body) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: templateForm.name,
      subject: templateForm.subject,
      body: templateForm.body,
      category: templateForm.category as EmailTemplate['category'],
      updated_at: new Date().toISOString(),
    }
    if (editingTemplate) {
      const { data } = await supabase.from('email_templates').update(payload).eq('id', editingTemplate.id).select().single()
      if (data) setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? data as EmailTemplate : t)))
    } else {
      const { data } = await supabase.from('email_templates').insert({ ...payload, created_by: currentUser.id, created_at: new Date().toISOString() }).select().single()
      if (data) setTemplates((prev) => [...prev, data as EmailTemplate])
    }
    setSaving(false)
    setShowTemplateModal(false)
    setEditingTemplate(null)
    setTemplateForm({ name: '', subject: '', body: '', category: 'autre' })
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Supprimer ce template ?')) return
    const supabase = createClient()
    await supabase.from('email_templates').delete().eq('id', id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!sendForm.to_email || !sendForm.subject) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('emails_sent').insert({
      prospect_id: sendForm.prospect_id || null,
      template_id: sendForm.template_id || null,
      to_email: sendForm.to_email,
      subject: sendForm.subject,
      body: sendForm.body,
      status: 'envoye',
      sent_at: new Date().toISOString(),
      created_by: currentUser.id,
    }).select('*, prospect:prospects(company_name)').single()
    if (data) setSentEmails((prev) => [data as EmailSent, ...prev])
    setSendForm({ prospect_id: '', to_email: '', subject: '', body: '', template_id: '' })
    setSendSuccess(true)
    setTimeout(() => setSendSuccess(false), 3000)
    setSaving(false)
  }

  function applyTemplate(template: EmailTemplate) {
    setSendForm((f) => ({ ...f, subject: template.subject, body: template.body, template_id: template.id }))
    setTab('Nouvel email')
  }

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none"
  const inputStyle = { border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#ffffff' }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tabs */}
      <div
        className="flex items-center gap-3 px-6 py-3"
        style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}
      >
        {TAB_LABELS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t ? '#e8842c' : 'transparent',
              color: tab === t ? '#ffffff' : '#6b7280',
            }}
          >
            {t}
          </button>
        ))}
        {tab === 'Templates' && (
          <button
            onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', subject: '', body: '', category: 'autre' }); setShowTemplateModal(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto"
            style={{ backgroundColor: '#1e2d3d' }}
          >
            <Plus size={15} /> Nouveau template
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'Templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText size={14} style={{ color: '#e8842c' }} />
                      <h3 className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>{t.name}</h3>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block"
                      style={{ backgroundColor: '#f0f0ee', color: '#6b7280' }}>
                      {CAT_LABELS[t.category] || t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, subject: t.subject, body: t.body, category: t.category }); setShowTemplateModal(true) }}>
                      <Pencil size={13} style={{ color: '#6b7280' }} />
                    </button>
                    <button onClick={() => deleteTemplate(t.id)}>
                      <Trash2 size={13} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </div>
                <p className="text-xs font-medium mb-1" style={{ color: '#1e2d3d' }}>Sujet : {t.subject}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  {t.body.slice(0, 80)}...
                </p>
                <button
                  onClick={() => applyTemplate(t)}
                  className="mt-3 w-full py-1.5 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: '#e8842c' }}
                >
                  Utiliser ce template
                </button>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-sm col-span-3" style={{ color: '#6b7280' }}>Aucun template.</p>
            )}
          </div>
        )}

        {tab === 'Historique' && (
          <div className="space-y-2">
            {sentEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#f0f7ff', color: '#3b82f6' }}
                >
                  <Mail size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>{email.subject}</p>
                    <span className="text-xs" style={{ color: '#6b7280' }}>{formatDate(email.sent_at)}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                    À: {email.to_email}
                    {(email as EmailSent & { prospect?: { company_name: string } }).prospect && (
                      <> · {(email as EmailSent & { prospect?: { company_name: string } }).prospect?.company_name}</>
                    )}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: email.status === 'envoye' ? '#ecfdf5' : '#fef2f2',
                    color: email.status === 'envoye' ? '#10b981' : '#ef4444',
                  }}
                >
                  {email.status === 'envoye' ? 'Envoyé' : 'Échec'}
                </span>
              </div>
            ))}
            {sentEmails.length === 0 && (
              <p className="text-sm" style={{ color: '#6b7280' }}>Aucun email envoyé.</p>
            )}
          </div>
        )}

        {tab === 'Nouvel email' && (
          <div className="max-w-lg">
            {sendSuccess && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
                ✅ Email enregistré dans l'historique.
              </div>
            )}
            <form onSubmit={sendEmail} className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Prospect (optionnel)</label>
                <select
                  value={sendForm.prospect_id}
                  onChange={(e) => setSendForm((f) => ({ ...f, prospect_id: e.target.value }))}
                  className={inputCls} style={inputStyle}
                >
                  <option value="">Aucun</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>{p.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Email destinataire *</label>
                <input type="email" value={sendForm.to_email}
                  onChange={(e) => setSendForm((f) => ({ ...f, to_email: e.target.value }))}
                  placeholder="contact@client.fr" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Sujet *</label>
                <input value={sendForm.subject}
                  onChange={(e) => setSendForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Objet de l'email" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Corps du message</label>
                <textarea value={sendForm.body}
                  onChange={(e) => setSendForm((f) => ({ ...f, body: e.target.value }))}
                  rows={8} placeholder="Rédigez votre email ici..."
                  className={inputCls} style={inputStyle} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSendForm({ prospect_id: '', to_email: '', subject: '', body: '', template_id: '' })}
                  className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}>
                  Effacer
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#e8842c' }}>
                  <Send size={14} /> {saving ? 'Envoi...' : 'Enregistrer l\'email'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowTemplateModal(false) }}
        >
          <div className="rounded-2xl p-6 w-full max-w-lg" style={{ backgroundColor: '#ffffff' }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: '#1e2d3d' }}>
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </h2>
            <form onSubmit={saveTemplate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Nom</label>
                  <input value={templateForm.name}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Catégorie</label>
                  <select value={templateForm.category}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, category: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    <option value="prospection">Prospection</option>
                    <option value="relance">Relance</option>
                    <option value="proposition">Proposition</option>
                    <option value="remerciement">Remerciement</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Sujet</label>
                <input value={templateForm.subject}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, subject: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Corps</label>
                <textarea value={templateForm.body}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, body: e.target.value }))}
                  rows={6} className={inputCls} style={inputStyle} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowTemplateModal(false)}
                  className="flex-1 py-2 rounded-lg text-sm" style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#e8842c' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
