'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle, Clock, Send, ChevronDown, ChevronUp, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { IaProposal } from '@/lib/types'

interface Props {
  initialProposals: IaProposal[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Brouillon',
    color: '#6b7280',
    bg: '#f8f8f6',
    icon: <Clock size={12} />,
  },
  validated: {
    label: 'Validée',
    color: '#10b981',
    bg: '#f0fdf4',
    icon: <CheckCircle size={12} />,
  },
  sent: {
    label: 'Envoyée',
    color: '#3b82f6',
    bg: '#eff6ff',
    icon: <Send size={12} />,
  },
}

export default function IntelligenceClient({ initialProposals }: Props) {
  const [proposals] = useState<IaProposal[]>(initialProposals)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'draft' | 'validated' | 'sent'>('all')

  const filtered = proposals.filter((p) => filter === 'all' || p.status === filter)

  const counts = {
    all: proposals.length,
    draft: proposals.filter((p) => p.status === 'draft').length,
    validated: proposals.filter((p) => p.status === 'validated').length,
    sent: proposals.filter((p) => p.status === 'sent').length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'all', label: 'Total', color: '#e8842c' },
          { key: 'draft', label: 'Brouillons', color: '#6b7280' },
          { key: 'validated', label: 'Validées', color: '#10b981' },
          { key: 'sent', label: 'Envoyées', color: '#3b82f6' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className="rounded-2xl p-4 text-left transition-all"
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${filter === key ? color : '#e5e5e3'}`,
              boxShadow: filter === key ? `0 0 0 2px ${color}20` : '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-2xl font-bold mb-1" style={{ color }}>
              {counts[key as keyof typeof counts]}
            </p>
            <p className="text-xs" style={{ color: '#6b7280' }}>{label}</p>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: '#fff7ed' }}
          >
            <Sparkles size={24} style={{ color: '#e8842c' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: '#1e2d3d' }}>
            Aucune proposition IA
          </p>
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Générez des propositions depuis le pipeline commercial
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proposal) => {
            const status = statusConfig[proposal.status] ?? statusConfig.draft
            const isOpen = expanded === proposal.id
            const subject = proposal.modified_email_subject ?? proposal.email_subject
            const body = proposal.modified_email_body ?? proposal.email_body
            const prospectName = (proposal.prospect as { company_name?: string } | undefined)?.company_name
            const dealTitle = (proposal.deal as { title?: string } | undefined)?.title

            return (
              <div
                key={proposal.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                {/* Row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : proposal.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#fff7ed' }}
                  >
                    <Sparkles size={15} style={{ color: '#e8842c' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1e2d3d' }}>
                      {subject}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {prospectName && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
                          <Building2 size={11} />
                          {prospectName}
                        </span>
                      )}
                      {dealTitle && (
                        <span className="text-xs" style={{ color: '#6b7280' }}>
                          · {dealTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                    <span className="text-xs" style={{ color: '#6b7280' }}>
                      {formatDate(proposal.created_at)}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} style={{ color: '#6b7280' }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: '#6b7280' }} />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div
                    className="px-5 pb-5 space-y-4"
                    style={{ borderTop: '1px solid #f0f0ee' }}
                  >
                    {/* Arguments */}
                    {proposal.key_arguments?.length > 0 && (
                      <div className="pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7280' }}>
                          Arguments clés
                        </p>
                        <div className="space-y-1.5">
                          {proposal.key_arguments.map((arg, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-xs font-bold flex-shrink-0" style={{ color: '#e8842c' }}>
                                {i + 1}.
                              </span>
                              <p className="text-xs" style={{ color: '#1e2d3d' }}>{arg}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Urgency & risk */}
                    {(proposal.urgency_reason || proposal.risk_if_no_action) && (
                      <div className="grid grid-cols-2 gap-3">
                        {proposal.urgency_reason && (
                          <div
                            className="rounded-xl p-3"
                            style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: '#e8842c' }}>Pourquoi maintenant</p>
                            <p className="text-xs" style={{ color: '#1e2d3d' }}>{proposal.urgency_reason}</p>
                          </div>
                        )}
                        {proposal.risk_if_no_action && (
                          <div
                            className="rounded-xl p-3"
                            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: '#dc2626' }}>Risque si inaction</p>
                            <p className="text-xs" style={{ color: '#1e2d3d' }}>{proposal.risk_if_no_action}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Email body preview */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7280' }}>
                        Email {proposal.modified_email_body ? '(modifié)' : 'généré'}
                      </p>
                      <div
                        className="rounded-xl p-4"
                        style={{ backgroundColor: '#f8f8f6', border: '1px solid #e5e5e3' }}
                      >
                        <pre
                          className="text-xs whitespace-pre-wrap font-sans"
                          style={{ color: '#1e2d3d', lineHeight: '1.6' }}
                        >
                          {body}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
