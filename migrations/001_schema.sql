-- =============================================================================
-- DAIRIA Sales — Schema Supabase
-- =============================================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  role text check (role in ('admin', 'commercial', 'avocat')) default 'commercial' not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Prospects
create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  siren text,
  sector text,
  size text,
  website text,
  address text,
  score text check (score in ('chaud', 'tiede', 'froid')) default 'froid' not null,
  tags text[] default '{}',
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Contacts (multiple per prospect)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  "function" text,
  is_primary boolean default false not null,
  created_at timestamptz default now() not null
);

-- Interactions (timeline)
create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade not null,
  type text check (type in ('appel', 'email', 'meeting', 'note', 'autre')) not null,
  notes text,
  date timestamptz default now() not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Deals (pipeline)
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade not null,
  title text not null,
  amount numeric(12,2) default 0 not null,
  stage text check (stage in ('prospect', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu')) default 'prospect' not null,
  probability integer default 10 check (probability >= 0 and probability <= 100) not null,
  source text check (source in ('referral', 'website', 'linkedin', 'cold_call', 'event', 'autre')),
  assigned_to uuid references profiles(id) on delete set null,
  notes text,
  closed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Services (catalogue)
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('contentieux', 'conseil', 'conformite', 'formation', 'audit', 'autre')) not null,
  description text,
  unit_price numeric(12,2),
  hourly_rate numeric(12,2),
  is_hourly boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Propositions
create table if not exists propositions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete set null,
  prospect_id uuid references prospects(id) on delete cascade not null,
  title text not null,
  status text check (status in ('brouillon', 'envoyee', 'acceptee', 'refusee', 'expiree')) default 'brouillon' not null,
  total_amount numeric(12,2) default 0 not null,
  conditions text,
  valid_until date,
  sent_at timestamptz,
  opened_at timestamptz,
  answered_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Proposition line items
create table if not exists proposition_items (
  id uuid primary key default gen_random_uuid(),
  proposition_id uuid references propositions(id) on delete cascade not null,
  service_id uuid references services(id) on delete set null,
  description text not null,
  quantity numeric(10,2) default 1 not null,
  unit_price numeric(12,2) default 0 not null,
  total_price numeric(12,2) default 0 not null,
  sort_order integer default 0 not null
);

-- Tasks / Relances
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  status text check (status in ('a_faire', 'en_cours', 'fait', 'annule')) default 'a_faire' not null,
  priority text check (priority in ('faible', 'normale', 'haute')) default 'normale' not null,
  assigned_to uuid references profiles(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Email templates
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  category text check (category in ('prospection', 'relance', 'proposition', 'remerciement', 'autre')) default 'autre' not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Sent emails
create table if not exists emails_sent (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete set null,
  template_id uuid references email_templates(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  status text check (status in ('envoye', 'echec', 'brouillon')) default 'envoye' not null,
  sent_at timestamptz default now() not null,
  created_by uuid references profiles(id) on delete set null
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_prospects_company_name on prospects(company_name);
create index if not exists idx_prospects_score on prospects(score);
create index if not exists idx_prospects_created_at on prospects(created_at desc);
create index if not exists idx_contacts_prospect_id on contacts(prospect_id);
create index if not exists idx_interactions_prospect_id on interactions(prospect_id);
create index if not exists idx_interactions_date on interactions(date desc);
create index if not exists idx_deals_prospect_id on deals(prospect_id);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_deals_assigned_to on deals(assigned_to);
create index if not exists idx_deals_created_at on deals(created_at desc);
create index if not exists idx_propositions_prospect_id on propositions(prospect_id);
create index if not exists idx_propositions_status on propositions(status);
create index if not exists idx_tasks_due_date on tasks(due_date);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_assigned_to on tasks(assigned_to);
create index if not exists idx_emails_sent_prospect_id on emails_sent(prospect_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

alter table profiles enable row level security;
alter table prospects enable row level security;
alter table contacts enable row level security;
alter table interactions enable row level security;
alter table deals enable row level security;
alter table services enable row level security;
alter table propositions enable row level security;
alter table proposition_items enable row level security;
alter table tasks enable row level security;
alter table email_templates enable row level security;
alter table emails_sent enable row level security;

-- Profiles: users can read all, update own
create policy "profiles_select" on profiles for select using (auth.uid() is not null);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);

-- Prospects: authenticated users can CRUD
create policy "prospects_all" on prospects for all using (auth.uid() is not null);

-- Contacts: authenticated users
create policy "contacts_all" on contacts for all using (auth.uid() is not null);

-- Interactions: authenticated users
create policy "interactions_all" on interactions for all using (auth.uid() is not null);

-- Deals: authenticated users
create policy "deals_all" on deals for all using (auth.uid() is not null);

-- Services: authenticated users
create policy "services_all" on services for all using (auth.uid() is not null);

-- Propositions: authenticated users
create policy "propositions_all" on propositions for all using (auth.uid() is not null);

-- Proposition items: authenticated users
create policy "proposition_items_all" on proposition_items for all using (auth.uid() is not null);

-- Tasks: authenticated users
create policy "tasks_all" on tasks for all using (auth.uid() is not null);

-- Email templates: authenticated users
create policy "email_templates_all" on email_templates for all using (auth.uid() is not null);

-- Emails sent: authenticated users
create policy "emails_sent_all" on emails_sent for all using (auth.uid() is not null);

-- =============================================================================
-- TRIGGER: auto-create profile on user signup
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', null),
    'commercial'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- SEED DATA — Prestations de base
-- =============================================================================

insert into services (name, category, description, unit_price, hourly_rate, is_hourly) values
  ('Consultation initiale', 'conseil', 'Première consultation juridique', 250, null, false),
  ('Rédaction de contrat', 'conseil', 'Rédaction et révision de contrats', 800, null, false),
  ('Contentieux commercial', 'contentieux', 'Représentation en contentieux commercial', null, 350, true),
  ('Contentieux prud''homal', 'contentieux', 'Représentation devant le Conseil de Prud''hommes', null, 300, true),
  ('Audit conformité RGPD', 'conformite', 'Audit complet de conformité RGPD', 3500, null, false),
  ('Mise en conformité RGPD', 'conformite', 'Accompagnement mise en conformité', null, 250, true),
  ('Formation droit social', 'formation', 'Formation droit du travail et social', 2000, null, false),
  ('Formation RGPD', 'formation', 'Formation protection des données personnelles', 1500, null, false),
  ('Audit juridique entreprise', 'audit', 'Audit juridique global de l''entreprise', 5000, null, false),
  ('Accompagnement M&A', 'conseil', 'Accompagnement fusions-acquisitions', null, 400, true)
on conflict do nothing;
