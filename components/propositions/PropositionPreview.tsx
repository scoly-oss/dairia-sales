'use client'

import { X, Download } from 'lucide-react'
import { formatCurrency, formatDate, propositionStatusLabel } from '@/lib/utils'
import type { Proposition } from '@/lib/types'

interface Props {
  proposition: Proposition
  onClose: () => void
}

export default function PropositionPreview({ proposition, onClose }: Props) {
  const prospect = (proposition as Proposition & { prospect?: { company_name: string } }).prospect

  function handlePrint() {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="rounded-[14px] w-full max-w-2xl max-h-[95vh] overflow-y-auto no-print"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e3' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>
            Aperçu de la proposition
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: '#e8842c' }}
            >
              <Download size={14} /> Imprimer / PDF
            </button>
            <button onClick={onClose}>
              <X size={18} style={{ color: '#6b7280' }} />
            </button>
          </div>
        </div>

        {/* Proposition content (printable) */}
        <div id="proposition-print" className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3"
                style={{ backgroundColor: '#e8842c' }}
              >
                D
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#1e2d3d' }}>DAIRIA Avocats</h1>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Cabinet d'Avocats</p>
            </div>
            <div className="text-right">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: '#6b7280' }}
              >
                Proposition commerciale
              </p>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Date : {formatDate(proposition.created_at)}
              </p>
              {proposition.valid_until && (
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  Valide jusqu'au : {formatDate(proposition.valid_until)}
                </p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#1e2d3d' }}>{proposition.title}</h2>
            <div className="mt-2">
              <span className="text-sm" style={{ color: '#6b7280' }}>Client : </span>
              <span className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>
                {prospect?.company_name || '—'}
              </span>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-6" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e2d3d' }}>
                <th className="px-4 py-2 text-left text-sm text-white font-semibold">Description</th>
                <th className="px-4 py-2 text-center text-sm text-white font-semibold w-20">Qté</th>
                <th className="px-4 py-2 text-right text-sm text-white font-semibold w-28">Prix unit.</th>
                <th className="px-4 py-2 text-right text-sm text-white font-semibold w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {(proposition.items || []).map((item, i) => (
                <tr
                  key={item.id || i}
                  style={{ backgroundColor: i % 2 === 0 ? '#f8f8f6' : '#ffffff' }}
                >
                  <td className="px-4 py-3 text-sm" style={{ color: '#1e2d3d' }}>{item.description}</td>
                  <td className="px-4 py-3 text-sm text-center" style={{ color: '#6b7280' }}>{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: '#6b7280' }}>
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: '#1e2d3d' }}>
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#fff7ed', borderTop: '2px solid #e8842c' }}>
                <td colSpan={3} className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#1e2d3d' }}>
                  Total HT
                </td>
                <td className="px-4 py-3 text-base font-bold text-right" style={{ color: '#e8842c' }}>
                  {formatCurrency(proposition.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Conditions */}
          {proposition.conditions && (
            <div
              className="p-4 rounded-xl text-sm"
              style={{ backgroundColor: '#f8f8f6', color: '#6b7280' }}
            >
              <p className="font-semibold mb-1" style={{ color: '#1e2d3d' }}>Conditions</p>
              <p className="whitespace-pre-wrap">{proposition.conditions}</p>
            </div>
          )}

          {/* Signature */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #e5e5e3' }}>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#1e2d3d' }}>DAIRIA Avocats</p>
                <div className="h-16 mt-4" style={{ borderBottom: '1px solid #6b7280' }} />
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Signature & cachet</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#1e2d3d' }}>
                  {prospect?.company_name || 'Le client'}
                </p>
                <p className="text-xs" style={{ color: '#6b7280' }}>Bon pour accord</p>
                <div className="h-16 mt-4" style={{ borderBottom: '1px solid #6b7280' }} />
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Date & signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
