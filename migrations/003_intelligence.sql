-- =============================================================================
-- DAIRIA Sales — Intelligence IA : Propositions générées par Claude
-- =============================================================================

create table if not exists ia_proposals (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade not null,
  prospect_id uuid references prospects(id) on delete cascade not null,
  -- Contenu généré par Claude
  email_subject text not null,
  email_body text not null,
  key_arguments text[] default '{}' not null,
  urgency_reason text,
  risk_if_no_action text,
  -- Statut de validation
  status text check (status in ('draft', 'validated', 'sent')) default 'draft' not null,
  -- Contenu modifié par l'avocat (optionnel)
  modified_email_subject text,
  modified_email_body text,
  -- Métadonnées
  created_by uuid references profiles(id) on delete set null,
  validated_by uuid references profiles(id) on delete set null,
  validated_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Row Level Security
alter table ia_proposals enable row level security;

create policy "ia_proposals_authenticated_access"
  on ia_proposals for all
  to authenticated
  using (true)
  with check (true);

-- Index pour les requêtes fréquentes
create index if not exists idx_ia_proposals_deal_id on ia_proposals(deal_id);
create index if not exists idx_ia_proposals_prospect_id on ia_proposals(prospect_id);
create index if not exists idx_ia_proposals_status on ia_proposals(status);
create index if not exists idx_ia_proposals_created_by on ia_proposals(created_by);
create index if not exists idx_ia_proposals_created_at on ia_proposals(created_at desc);
