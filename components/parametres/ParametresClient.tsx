'use client'

import { useState, useRef } from 'react'
import { Download, Upload, User, Users, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { Profile, Prospect } from '@/lib/types'

const TAB_LABELS = ['Profil', 'Équipe', 'Import/Export'] as const
type Tab = typeof TAB_LABELS[number]

interface Props {
  currentUser: Profile
  allProfiles: Profile[]
  prospects: Prospect[]
}

export default function ParametresClient({ currentUser, allProfiles, prospects }: Props) {
  const [tab, setTab] = useState<Tab>('Profil')
  const [profileForm, setProfileForm] = useState({ name: currentUser.name || '', email: currentUser.email })
  const [profiles, setProfiles] = useState(allProfiles)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      name: profileForm.name,
      updated_at: new Date().toISOString(),
    }).eq('id', currentUser.id)
    setMsg('Profil mis à jour.')
    setTimeout(() => setMsg(''), 3000)
    setSaving(false)
  }

  async function changeRole(profileId: string, role: string) {
    if (currentUser.role !== 'admin') return
    const supabase = createClient()
    await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', profileId)
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role: role as Profile['role'] } : p)))
  }

  function exportCSV() {
    const headers = ['Entreprise', 'SIREN', 'Secteur', 'Taille', 'Site web', 'Adresse', 'Score', 'Tags', 'Créé le']
    const rows = prospects.map((p) => [
      p.company_name, p.siren || '', p.sector || '', p.size || '',
      p.website || '', p.address || '', p.score, (p.tags || []).join(';'), p.created_at.split('T')[0],
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dairia-prospects-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { default: Papa } = await import('papaparse')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const rows = results.data as Record<string, string>[]
        let count = 0
        for (const row of rows) {
          const company = row['Entreprise'] || row['company_name'] || row['entreprise']
          if (!company) continue
          await supabase.from('prospects').insert({
            company_name: company,
            siren: row['SIREN'] || row['siren'] || null,
            sector: row['Secteur'] || row['sector'] || null,
            size: row['Taille'] || row['size'] || null,
            website: row['Site web'] || row['website'] || null,
            address: row['Adresse'] || row['address'] || null,
            score: (row['Score'] || row['score'] || 'froid') as Prospect['score'],
            tags: row['Tags'] ? row['Tags'].split(';').map((t: string) => t.trim()).filter(Boolean) : [],
            created_by: user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          count++
        }
        setMsg(`${count} prospects importés avec succès.`)
        setTimeout(() => setMsg(''), 5000)
      },
    })
  }

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none"
  const inputStyle = { border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#ffffff' }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        className="flex items-center gap-3 px-6 py-3"
        style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}
      >
        {TAB_LABELS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: tab === t ? '#e8842c' : 'transparent',
              color: tab === t ? '#ffffff' : '#6b7280',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {msg && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            {msg}
          </div>
        )}

        {tab === 'Profil' && (
          <div className="max-w-md">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: '#e8842c' }}
              >
                {getInitials(currentUser.name || currentUser.email)}
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: '#1e2d3d' }}>
                  {currentUser.name || 'Non renseigné'}
                </h3>
                <p className="text-sm" style={{ color: '#6b7280' }}>{currentUser.email}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#fff7ed', color: '#e8842c' }}
                >
                  {currentUser.role}
                </span>
              </div>
            </div>
            <form onSubmit={saveProfile} className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Nom complet</label>
                <input value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Email</label>
                <input value={profileForm.email} disabled className={inputCls}
                  style={{ ...inputStyle, backgroundColor: '#f8f8f6', color: '#6b7280' }} />
              </div>
              <button type="submit" disabled={saving}
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#e8842c' }}>
                {saving ? 'Enregistrement...' : 'Mettre à jour'}
              </button>
            </form>
          </div>
        )}

        {tab === 'Équipe' && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1e2d3d' }}>
              Membres de l'équipe ({profiles.length})
            </h3>
            <div className="space-y-2">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: '#1e2d3d' }}
                  >
                    {getInitials(p.name || p.email)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>{p.name || '—'}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{p.email}</p>
                  </div>
                  {currentUser.role === 'admin' ? (
                    <select
                      value={p.role}
                      onChange={(e) => changeRole(p.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg outline-none"
                      style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
                    >
                      <option value="admin">Admin</option>
                      <option value="commercial">Commercial</option>
                      <option value="avocat">Avocat</option>
                    </select>
                  ) : (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: '#f0f0ee', color: '#6b7280' }}
                    >
                      {p.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Import/Export' && (
          <div className="max-w-lg space-y-6">
            <div
              className="p-6 rounded-xl"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
            >
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1e2d3d' }}>
                Exporter les prospects
              </h3>
              <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                Exporte tous les prospects en CSV ({prospects.length} prospects).
              </p>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#1e2d3d' }}
              >
                <Download size={15} /> Exporter CSV
              </button>
            </div>

            <div
              className="p-6 rounded-xl"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
            >
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1e2d3d' }}>
                Importer des prospects
              </h3>
              <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                Format attendu : CSV avec colonnes Entreprise, SIREN, Secteur, Taille, Site web, Adresse, Score, Tags.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={importCSV}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#e8842c' }}
              >
                <Upload size={15} /> Importer CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
