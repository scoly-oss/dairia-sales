'use client'

import { useState } from 'react'
import {
  Eye,
  Globe,
  TrendingUp,
  Star,
  Archive,
  ExternalLink,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Minus,
  Filter,
  Building2,
  Zap,
  Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, sanitizeUrl } from '@/lib/utils'
import type { VeilleAlerte, VeilleConcurrent, VeilleConfig, VeilleType, VeilleImportance } from '@/lib/types'

interface VeilleClientProps {
  initialAlertes: VeilleAlerte[]
  initialConcurrents: VeilleConcurrent[]
  initialConfig: VeilleConfig | null
}

type ActiveTab = 'alertes' | 'concurrents'

const TYPE_LABELS: Record<VeilleType, string> = {
  concurrentielle: 'Concurrentielle',
  marche: 'Marché',
  reputation: 'Réputation',
}

const TYPE_COLORS: Record<VeilleType, { bg: string; text: string; border: string }> = {
  concurrentielle: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  marche: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  reputation: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
}

const IMPORTANCE_COLORS: Record<VeilleImportance, { bg: string; text: string }> = {
  haute: { bg: '#fef2f2', text: '#dc2626' },
  normale: { bg: '#fffbeb', text: '#d97706' },
  faible: { bg: '#f9fafb', text: '#6b7280' },
}

const SENTIMENT_CONFIG = {
  positif: { icon: CheckCircle, color: '#10b981', label: 'Positif' },
  neutre: { icon: Minus, color: '#6b7280', label: 'Neutre' },
  negatif: { icon: AlertTriangle, color: '#ef4444', label: 'Négatif' },
}

const CONCURRENT_TYPE_LABELS: Record<string, string> = {
  cabinet: 'Cabinet d\'avocats',
  legaltech: 'Legaltech',
  saas: 'SaaS / RH',
}

const CONCURRENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  cabinet: { bg: '#fdf4ff', text: '#7e22ce' },
  legaltech: { bg: '#fff7ed', text: '#c2410c' },
  saas: { bg: '#eff6ff', text: '#1d4ed8' },
}

export default function VeilleClient({ initialAlertes, initialConcurrents, initialConfig }: VeilleClientProps) {
  const [alertes, setAlertes] = useState<VeilleAlerte[]>(initialAlertes)
  const [activeTab, setActiveTab] = useState<ActiveTab>('alertes')
  const [filterType, setFilterType] = useState<VeilleType | ''>('')
  const [filterImportance, setFilterImportance] = useState<VeilleImportance | ''>('')
  const [filterLu, setFilterLu] = useState<'all' | 'lu' | 'non_lu'>('all')
  const [selectedAlerte, setSelectedAlerte] = useState<VeilleAlerte | null>(null)
  const [selectedConcurrent, setSelectedConcurrent] = useState<VeilleConcurrent | null>(null)
  const [creatingProspect, setCreatingProspect] = useState<string | null>(null)

  const nonLuCount = alertes.filter((a) => !a.lu).length

  const filteredAlertes = alertes.filter((a) => {
    if (filterType && a.type !== filterType) return false
    if (filterImportance && a.importance !== filterImportance) return false
    if (filterLu === 'lu' && !a.lu) return false
    if (filterLu === 'non_lu' && a.lu) return false
    return true
  })

  async function handleMarkLu(id: string) {
    const supabase = createClient()
    await supabase.from('veille_alertes').update({ lu: true }).eq('id', id)
    setAlertes((prev) => prev.map((a) => (a.id === id ? { ...a, lu: true } : a)))
    if (selectedAlerte?.id === id) setSelectedAlerte((a) => a ? { ...a, lu: true } : null)
  }

  async function handleArchive(id: string) {
    const supabase = createClient()
    await supabase.from('veille_alertes').update({ archive: true }).eq('id', id)
    setAlertes((prev) => prev.filter((a) => a.id !== id))
    if (selectedAlerte?.id === id) setSelectedAlerte(null)
  }

  async function handleCreateProspect(alerte: VeilleAlerte) {
    setCreatingProspect(alerte.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: prospect, error } = await supabase
      .from('prospects')
      .insert({
        company_name: alerte.titre.slice(0, 80),
        notes: alerte.resume,
        score: 'chaud',
        tags: ['veille', alerte.categorie],
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (!error && prospect) {
      await supabase
        .from('veille_alertes')
        .update({ prospect_id: prospect.id })
        .eq('id', alerte.id)
      setAlertes((prev) => prev.map((a) => a.id === alerte.id ? { ...a, prospect_id: prospect.id } : a))
      if (selectedAlerte?.id === alerte.id) setSelectedAlerte((a) => a ? { ...a, prospect_id: prospect.id } : null)
    }
    setCreatingProspect(null)
  }

  function openAlerte(alerte: VeilleAlerte) {
    setSelectedAlerte(alerte)
    if (!alerte.lu) handleMarkLu(alerte.id)
  }

  const tabStyle = (tab: ActiveTab) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: activeTab === tab ? '#1e2d3d' : 'transparent',
    color: activeTab === tab ? '#ffffff' : '#6b7280',
    transition: 'all 0.15s',
  })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-wrap gap-3"
        style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center gap-2">
          <button style={tabStyle('alertes')} onClick={() => setActiveTab('alertes')}>
            Alertes
            {nonLuCount > 0 && (
              <span
                className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#e8842c', color: '#fff' }}
              >
                {nonLuCount}
              </span>
            )}
          </button>
          <button style={tabStyle('concurrents')} onClick={() => setActiveTab('concurrents')}>
            Concurrents
            <span
              className="ml-2 px-1.5 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
            >
              {initialConcurrents.length}
            </span>
          </button>
        </div>

        {activeTab === 'alertes' && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} style={{ color: '#6b7280' }} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as VeilleType | '')}
              className="text-sm rounded-lg px-2 py-1.5"
              style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
            >
              <option value="">Tous les types</option>
              <option value="concurrentielle">Concurrentielle</option>
              <option value="marche">Marché</option>
              <option value="reputation">Réputation</option>
            </select>
            <select
              value={filterImportance}
              onChange={(e) => setFilterImportance(e.target.value as VeilleImportance | '')}
              className="text-sm rounded-lg px-2 py-1.5"
              style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
            >
              <option value="">Toutes importances</option>
              <option value="haute">Haute</option>
              <option value="normale">Normale</option>
              <option value="faible">Faible</option>
            </select>
            <select
              value={filterLu}
              onChange={(e) => setFilterLu(e.target.value as 'all' | 'lu' | 'non_lu')}
              className="text-sm rounded-lg px-2 py-1.5"
              style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
            >
              <option value="all">Toutes</option>
              <option value="non_lu">Non lues</option>
              <option value="lu">Lues</option>
            </select>
          </div>
        )}
      </div>

      {/* Stats bar (alertes only) */}
      {activeTab === 'alertes' && (
        <div
          className="flex items-center gap-6 px-6 py-3"
          style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#fafafa' }}
        >
          {(['concurrentielle', 'marche', 'reputation'] as VeilleType[]).map((type) => {
            const count = alertes.filter((a) => a.type === type).length
            const unread = alertes.filter((a) => a.type === type && !a.lu).length
            const colors = TYPE_COLORS[type]
            const icons = { concurrentielle: Globe, marche: TrendingUp, reputation: Star }
            const Icon = icons[type]
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? '' : type)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: filterType === type ? colors.bg : 'transparent',
                  border: `1px solid ${filterType === type ? colors.border : 'transparent'}`,
                }}
              >
                <Icon size={13} style={{ color: colors.text }} />
                <span className="text-xs font-medium" style={{ color: colors.text }}>
                  {TYPE_LABELS[type]}
                </span>
                <span
                  className="text-xs font-bold px-1 rounded"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {count}
                </span>
                {unread > 0 && (
                  <span
                    className="text-xs font-bold px-1 rounded"
                    style={{ backgroundColor: '#e8842c', color: '#fff' }}
                  >
                    {unread} new
                  </span>
                )}
              </button>
            )
          })}
          <div className="ml-auto text-xs" style={{ color: '#6b7280' }}>
            {filteredAlertes.length} alerte{filteredAlertes.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#f8f8f6' }}>
        {activeTab === 'alertes' && (
          <div className="space-y-3 max-w-4xl">
            {filteredAlertes.length === 0 ? (
              <div
                className="rounded-[14px] p-12 text-center"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
              >
                <Eye size={32} className="mx-auto mb-3" style={{ color: '#e5e5e3' }} />
                <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                  Aucune alerte de veille
                </p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  Modifiez les filtres ou attendez la prochaine synchronisation
                </p>
              </div>
            ) : (
              filteredAlertes.map((alerte) => (
                <AlerteCard
                  key={alerte.id}
                  alerte={alerte}
                  onOpen={openAlerte}
                  onArchive={handleArchive}
                  onCreateProspect={handleCreateProspect}
                  creatingProspect={creatingProspect}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'concurrents' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl">
            {initialConcurrents.map((concurrent) => (
              <ConcurrentCard
                key={concurrent.id}
                concurrent={concurrent}
                onSelect={setSelectedConcurrent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Alert detail modal */}
      {selectedAlerte && (
        <AlerteDetailModal
          alerte={selectedAlerte}
          onClose={() => setSelectedAlerte(null)}
          onArchive={handleArchive}
          onCreateProspect={handleCreateProspect}
          creatingProspect={creatingProspect}
        />
      )}

      {/* Concurrent detail modal */}
      {selectedConcurrent && (
        <ConcurrentDetailModal
          concurrent={selectedConcurrent}
          onClose={() => setSelectedConcurrent(null)}
        />
      )}
    </div>
  )
}

// ─── AlerteCard ──────────────────────────────────────────────────────────────

interface AlerteCardProps {
  alerte: VeilleAlerte
  onOpen: (a: VeilleAlerte) => void
  onArchive: (id: string) => void
  onCreateProspect: (a: VeilleAlerte) => void
  creatingProspect: string | null
}

function AlerteCard({ alerte, onOpen, onArchive, onCreateProspect, creatingProspect }: AlerteCardProps) {
  const typeColors = TYPE_COLORS[alerte.type]
  const importanceColors = IMPORTANCE_COLORS[alerte.importance]
  const sentimentConf = alerte.sentiment ? SENTIMENT_CONFIG[alerte.sentiment] : null

  return (
    <div
      className="rounded-[14px] p-4 cursor-pointer transition-all hover:shadow-md"
      style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${alerte.lu ? '#e5e5e3' : '#e8842c'}`,
        borderLeft: `4px solid ${typeColors.text}`,
        boxShadow: '0 1px 4px rgba(30,45,61,0.06)',
        opacity: alerte.lu ? 0.85 : 1,
      }}
      onClick={() => onOpen(alerte)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
            >
              {TYPE_LABELS[alerte.type]}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: importanceColors.bg, color: importanceColors.text }}
            >
              {alerte.importance === 'haute' ? '⚡ Haute' : alerte.importance === 'normale' ? 'Normale' : 'Faible'}
            </span>
            {sentimentConf && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: sentimentConf.color }}>
                <sentimentConf.icon size={11} />
                {sentimentConf.label}
              </span>
            )}
            {!alerte.lu && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#e8842c', color: '#fff' }}
              >
                Nouveau
              </span>
            )}
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#1e2d3d' }}>
            {alerte.titre}
          </p>
          {alerte.resume && (
            <p className="text-xs line-clamp-2" style={{ color: '#6b7280' }}>
              {alerte.resume}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
            {formatDate(alerte.created_at, 'dd/MM/yyyy')}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {alerte.type === 'marche' && !alerte.prospect_id && (
            <button
              onClick={() => onCreateProspect(alerte)}
              disabled={creatingProspect === alerte.id}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
              style={{ backgroundColor: '#e8842c', color: '#fff' }}
              title="Créer un prospect"
            >
              <Plus size={11} />
              Prospect
            </button>
          )}
          {alerte.prospect_id && (
            <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
              ✓ Prospect créé
            </span>
          )}
          <button
            onClick={() => onArchive(alerte.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
            title="Archiver"
          >
            <Archive size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AlerteDetailModal ────────────────────────────────────────────────────────

interface AlerteDetailModalProps {
  alerte: VeilleAlerte
  onClose: () => void
  onArchive: (id: string) => void
  onCreateProspect: (a: VeilleAlerte) => void
  creatingProspect: string | null
}

function AlerteDetailModal({ alerte, onClose, onArchive, onCreateProspect, creatingProspect }: AlerteDetailModalProps) {
  const typeColors = TYPE_COLORS[alerte.type]
  const importanceColors = IMPORTANCE_COLORS[alerte.importance]
  const sentimentConf = alerte.sentiment ? SENTIMENT_CONFIG[alerte.sentiment] : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[14px] p-6"
        style={{ backgroundColor: '#ffffff', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
            >
              {TYPE_LABELS[alerte.type]}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: importanceColors.bg, color: importanceColors.text }}
            >
              {alerte.importance === 'haute' ? '⚡ Haute priorité' : alerte.importance === 'normale' ? 'Normale' : 'Faible'}
            </span>
          </div>
          <button onClick={onClose} style={{ color: '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        <h2 className="text-lg font-semibold mb-3" style={{ color: '#1e2d3d' }}>
          {alerte.titre}
        </h2>

        {alerte.resume && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#374151' }}>
            {alerte.resume}
          </p>
        )}

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7280' }}>
            <span className="font-medium" style={{ color: '#1e2d3d' }}>Date :</span>
            {formatDate(alerte.created_at, 'dd/MM/yyyy')}
          </div>
          {alerte.sentiment && sentimentConf && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium" style={{ color: '#1e2d3d' }}>Sentiment :</span>
              <span className="flex items-center gap-1" style={{ color: sentimentConf.color }}>
                <sentimentConf.icon size={12} />
                {sentimentConf.label}
              </span>
            </div>
          )}
          {alerte.source_url && sanitizeUrl(alerte.source_url) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium" style={{ color: '#1e2d3d' }}>Source :</span>
              <a
                href={sanitizeUrl(alerte.source_url)!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: '#e8842c' }}
              >
                Voir la source <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {alerte.type === 'marche' && !alerte.prospect_id && (
            <button
              onClick={() => onCreateProspect(alerte)}
              disabled={creatingProspect === alerte.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#e8842c', color: '#fff' }}
            >
              <Plus size={14} />
              {creatingProspect === alerte.id ? 'Création…' : 'Créer un prospect'}
            </button>
          )}
          {alerte.prospect_id && (
            <span className="text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
              ✓ Prospect créé dans le pipeline
            </span>
          )}
          <button
            onClick={() => { onArchive(alerte.id); onClose() }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
          >
            <Archive size={14} />
            Archiver
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ConcurrentCard ───────────────────────────────────────────────────────────

interface ConcurrentCardProps {
  concurrent: VeilleConcurrent
  onSelect: (c: VeilleConcurrent) => void
}

function ConcurrentCard({ concurrent, onSelect }: ConcurrentCardProps) {
  const typeColors = CONCURRENT_TYPE_COLORS[concurrent.type] || { bg: '#f9fafb', text: '#6b7280' }
  const typeLabel = CONCURRENT_TYPE_LABELS[concurrent.type] || concurrent.type
  const icons = { cabinet: Building2, legaltech: Zap, saas: Shield }
  const Icon = icons[concurrent.type as keyof typeof icons] || Building2

  return (
    <div
      className="rounded-[14px] p-4 cursor-pointer transition-all hover:shadow-md"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
      onClick={() => onSelect(concurrent)}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: typeColors.bg }}
        >
          <Icon size={18} style={{ color: typeColors.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#1e2d3d' }}>
            {concurrent.nom}
          </p>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
          >
            {typeLabel}
          </span>
        </div>
      </div>

      {concurrent.secteur && (
        <p className="text-xs mb-2" style={{ color: '#6b7280' }}>
          {concurrent.secteur}
        </p>
      )}

      {concurrent.forces.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: '#10b981' }}>Forces</p>
          <div className="flex flex-wrap gap-1">
            {concurrent.forces.slice(0, 2).map((f, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}
              >
                {f}
              </span>
            ))}
            {concurrent.forces.length > 2 && (
              <span className="text-xs" style={{ color: '#6b7280' }}>+{concurrent.forces.length - 2}</span>
            )}
          </div>
        </div>
      )}

      {concurrent.site_web && sanitizeUrl(concurrent.site_web) && (
        <a
          href={sanitizeUrl(concurrent.site_web)!}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:underline mt-2"
          style={{ color: '#e8842c' }}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={11} />
          {concurrent.site_web.replace('https://', '').replace('http://', '')}
        </a>
      )}
    </div>
  )
}

// ─── ConcurrentDetailModal ────────────────────────────────────────────────────

interface ConcurrentDetailModalProps {
  concurrent: VeilleConcurrent
  onClose: () => void
}

function ConcurrentDetailModal({ concurrent, onClose }: ConcurrentDetailModalProps) {
  const typeColors = CONCURRENT_TYPE_COLORS[concurrent.type] || { bg: '#f9fafb', text: '#6b7280' }
  const typeLabel = CONCURRENT_TYPE_LABELS[concurrent.type] || concurrent.type

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[14px] p-6"
        style={{ backgroundColor: '#ffffff', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
            >
              {typeLabel}
            </span>
          </div>
          <button onClick={onClose} style={{ color: '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        <h2 className="text-xl font-bold mb-1" style={{ color: '#1e2d3d' }}>
          {concurrent.nom}
        </h2>
        {concurrent.secteur && (
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
            {concurrent.secteur}
          </p>
        )}

        {concurrent.notes && (
          <p className="text-sm leading-relaxed mb-5 p-3 rounded-xl" style={{ backgroundColor: '#f8f8f6', color: '#374151' }}>
            {concurrent.notes}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {concurrent.forces.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#10b981' }}>
                Forces
              </p>
              <ul className="space-y-1">
                {concurrent.forces.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <span style={{ color: '#10b981' }}>+</span>
                    <span style={{ color: '#374151' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {concurrent.faiblesses.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#ef4444' }}>
                Faiblesses
              </p>
              <ul className="space-y-1">
                {concurrent.faiblesses.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <span style={{ color: '#ef4444' }}>−</span>
                    <span style={{ color: '#374151' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {concurrent.site_web && sanitizeUrl(concurrent.site_web) && (
          <a
            href={sanitizeUrl(concurrent.site_web)!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:underline"
            style={{ color: '#e8842c' }}
          >
            <ExternalLink size={14} />
            Visiter le site
          </a>
        )}
      </div>
    </div>
  )
}
