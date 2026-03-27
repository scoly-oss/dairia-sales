import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProposal } from '@/lib/claude'

export async function POST(request: NextRequest) {
  // Authentication check
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { deal_id } = body as Record<string, unknown>

  if (!deal_id || typeof deal_id !== 'string' || deal_id.trim().length === 0) {
    return NextResponse.json({ error: 'deal_id requis' }, { status: 400 })
  }

  // Validate UUID format to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(deal_id)) {
    return NextResponse.json({ error: 'deal_id invalide' }, { status: 400 })
  }

  // Fetch deal with prospect, contacts and interactions
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select(`
      *,
      prospect:prospects(
        *,
        contacts(*),
        interactions(*)
      )
    `)
    .eq('id', deal_id)
    .single()

  if (dealError || !deal) {
    return NextResponse.json({ error: 'Opportunité introuvable' }, { status: 404 })
  }

  const prospect = deal.prospect as {
    id: string
    company_name: string
    sector: string | null
    size: string | null
    score: string
    tags: string[]
    notes: string | null
    contacts: Array<{ name: string; email: string | null; function: string | null; is_primary: boolean }>
    interactions: Array<{ type: string; notes: string | null; date: string }>
  }

  if (!prospect) {
    return NextResponse.json({ error: 'Prospect associé introuvable' }, { status: 404 })
  }

  let generated
  try {
    generated = await generateProposal({
      prospect: prospect as Parameters<typeof generateProposal>[0]['prospect'],
      deal: deal as Parameters<typeof generateProposal>[0]['deal'],
      interactions: (prospect.interactions ?? []) as Parameters<typeof generateProposal>[0]['interactions'],
      contacts: (prospect.contacts ?? []) as Parameters<typeof generateProposal>[0]['contacts'],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur de génération IA'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Save generated proposal to database
  const { data: saved, error: saveError } = await supabase
    .from('ia_proposals')
    .insert({
      deal_id,
      prospect_id: deal.prospect_id,
      email_subject: generated.email_subject,
      email_body: generated.email_body,
      key_arguments: generated.key_arguments,
      urgency_reason: generated.urgency_reason || null,
      risk_if_no_action: generated.risk_if_no_action || null,
      status: 'draft',
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (saveError) {
    // Return the generated content even if save fails — non-blocking
    return NextResponse.json({ proposal: generated, id: null, save_error: saveError.message })
  }

  return NextResponse.json({ proposal: { ...generated, id: saved.id, status: 'draft' } })
}

// Update proposal (validate or modify before send)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { id, modified_email_subject, modified_email_body, status } = body as Record<string, unknown>

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'id invalide' }, { status: 400 })
  }

  const validStatuses = ['draft', 'validated', 'sent']
  if (status && !validStatuses.includes(status as string)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof modified_email_subject === 'string') {
    updatePayload.modified_email_subject = modified_email_subject
  }
  if (typeof modified_email_body === 'string') {
    updatePayload.modified_email_body = modified_email_body
  }
  if (status === 'validated') {
    updatePayload.status = 'validated'
    updatePayload.validated_by = user.id
    updatePayload.validated_at = new Date().toISOString()
  } else if (status === 'sent') {
    updatePayload.status = 'sent'
    updatePayload.sent_at = new Date().toISOString()
  } else if (status) {
    updatePayload.status = status
  }

  const { data: updated, error } = await supabase
    .from('ia_proposals')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ proposal: updated })
}
