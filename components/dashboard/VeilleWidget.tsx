import type { ComponentType } from 'react'
import Link from 'next/link'
import { Eye, AlertTriangle, CheckCircle, Minus, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { VeilleAlerte, VeilleType, VeilleSentiment } from '@/lib/types'

interface VeilleWidgetProps {
  alertes: VeilleAlerte[]
  nonLuCount: number
}

const TYPE_COLORS: Record<VeilleType, string> = {
  concurrentielle: '#c2410c',
  marche: '#15803d',
  reputation: '#1d4ed8',
}

const TYPE_BG: Record<VeilleType, string> = {
  concurrentielle: '#fff7ed',
  marche: '#f0fdf4',
  reputation: '#eff6ff',
}

const TYPE_LABELS: Record<VeilleType, string> = {
  concurrentielle: 'Conc.',
  marche: 'Marché',
  reputation: 'Réput.',
}

const SENTIMENT_ICONS: Record<VeilleSentiment, ComponentType<{ size: number; color?: string }>> = {
  positif: CheckCircle,
  neutre: Minus,
  negatif: AlertTriangle,
}

const SENTIMENT_COLORS: Record<VeilleSentiment, string> = {
  positif: '#10b981',
  neutre: '#6b7280',
  negatif: '#ef4444',
}

export default function VeilleWidget({ alertes, nonLuCount }: VeilleWidgetProps) {
  return (
    <div
      className="rounded-[14px] p-5"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye size={15} style={{ color: '#1e2d3d' }} />
          <h2 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>
            Veille Stratégique
          </h2>
          {nonLuCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: '#e8842c', color: '#fff' }}
            >
              {nonLuCount}
            </span>
          )}
        </div>
        <Link
          href="/veille"
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: '#e8842c' }}
        >
          Voir tout <ChevronRight size={12} />
        </Link>
      </div>

      {alertes.length === 0 ? (
        <p className="text-sm" style={{ color: '#6b7280' }}>
          Aucune alerte récente.
        </p>
      ) : (
        <div className="space-y-2.5">
          {alertes.map((alerte) => {
            const SentimentIcon = alerte.sentiment ? SENTIMENT_ICONS[alerte.sentiment] : null
            const sentimentColor = alerte.sentiment ? SENTIMENT_COLORS[alerte.sentiment] : '#6b7280'
            return (
              <Link
                key={alerte.id}
                href="/veille"
                className="flex items-start gap-3 group"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                  style={{ backgroundColor: TYPE_BG[alerte.type], color: TYPE_COLORS[alerte.type] }}
                >
                  {TYPE_LABELS[alerte.type].charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-xs font-medium truncate group-hover:underline"
                      style={{ color: alerte.lu ? '#6b7280' : '#1e2d3d', fontWeight: alerte.lu ? 400 : 600 }}
                    >
                      {alerte.titre}
                    </p>
                    {!alerte.lu && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#e8842c' }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: TYPE_BG[alerte.type], color: TYPE_COLORS[alerte.type] }}
                    >
                      {TYPE_LABELS[alerte.type]}
                    </span>
                    {SentimentIcon && (
                      <SentimentIcon size={11} color={sentimentColor} />
                    )}
                    <span className="text-xs" style={{ color: '#9ca3af' }}>
                      {formatDate(alerte.created_at, 'dd/MM')}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
