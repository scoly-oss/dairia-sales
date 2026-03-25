import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/intelligence — stats du dashboard
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [oppsResult, propsResult] = await Promise.all([
    supabase
      .from('opportunites_ia')
      .select('id, statut, ca_estime, created_at'),
    supabase
      .from('propositions_intelligentes')
      .select('id, resultat'),
  ])

  const opps = oppsResult.data || []
  const props = propsResult.data || []

  const startOfWeek = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString()

  const stats = {
    total_opportunites: opps.length,
    nouvelles_cette_semaine: opps.filter(
      (o) => o.created_at >= startOfWeek
    ).length,
    ca_potentiel: opps
      .filter((o) => ['nouvelle', 'vue', 'proposee'].includes(o.statut))
      .reduce((sum: number, o) => sum + (o.ca_estime || 0), 0),
    taux_conversion:
      props.length > 0
        ? Math.round(
            (props.filter((p) => p.resultat === 'converti').length /
              props.length) *
              100
          )
        : 0,
    opportunites_non_exploitees: opps.filter((o) =>
      ['nouvelle', 'vue'].includes(o.statut)
    ).length,
  }

  return NextResponse.json(stats)
}
