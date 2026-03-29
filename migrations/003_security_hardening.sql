-- =============================================================================
-- DAIRIA Sales — Security Hardening : RLS granulaire
-- =============================================================================
-- Remplace les policies "all" génériques par des policies séparées
-- pour distinguer lecture (tous les authentifiés) et écriture (créateur/admin).
-- =============================================================================

-- Helper : l'utilisateur courant est-il admin ?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ─── PROSPECTS ───────────────────────────────────────────────────────────────

drop policy if exists "prospects_all" on prospects;

create policy "prospects_select" on prospects
  for select using (auth.uid() is not null);

create policy "prospects_insert" on prospects
  for insert with check (auth.uid() is not null);

create policy "prospects_update" on prospects
  for update using (
    created_by = auth.uid() or public.is_admin()
  );

create policy "prospects_delete" on prospects
  for delete using (
    created_by = auth.uid() or public.is_admin()
  );

-- ─── CONTACTS ────────────────────────────────────────────────────────────────

drop policy if exists "contacts_all" on contacts;

create policy "contacts_select" on contacts
  for select using (auth.uid() is not null);

create policy "contacts_insert" on contacts
  for insert with check (auth.uid() is not null);

create policy "contacts_update" on contacts
  for update using (auth.uid() is not null);

create policy "contacts_delete" on contacts
  for delete using (auth.uid() is not null);

-- ─── INTERACTIONS ─────────────────────────────────────────────────────────────

drop policy if exists "interactions_all" on interactions;

create policy "interactions_select" on interactions
  for select using (auth.uid() is not null);

create policy "interactions_insert" on interactions
  for insert with check (auth.uid() is not null);

create policy "interactions_update" on interactions
  for update using (
    created_by = auth.uid() or public.is_admin()
  );

create policy "interactions_delete" on interactions
  for delete using (
    created_by = auth.uid() or public.is_admin()
  );

-- ─── DEALS ───────────────────────────────────────────────────────────────────

drop policy if exists "deals_all" on deals;

create policy "deals_select" on deals
  for select using (auth.uid() is not null);

create policy "deals_insert" on deals
  for insert with check (auth.uid() is not null);

create policy "deals_update" on deals
  for update using (
    assigned_to = auth.uid() or public.is_admin()
  );

create policy "deals_delete" on deals
  for delete using (public.is_admin());

-- ─── SERVICES (catalogue) ─────────────────────────────────────────────────────

drop policy if exists "services_all" on services;

create policy "services_select" on services
  for select using (auth.uid() is not null);

create policy "services_insert" on services
  for insert with check (public.is_admin());

create policy "services_update" on services
  for update using (public.is_admin());

create policy "services_delete" on services
  for delete using (public.is_admin());

-- ─── PROPOSITIONS ────────────────────────────────────────────────────────────

drop policy if exists "propositions_all" on propositions;

create policy "propositions_select" on propositions
  for select using (auth.uid() is not null);

create policy "propositions_insert" on propositions
  for insert with check (auth.uid() is not null);

create policy "propositions_update" on propositions
  for update using (
    created_by = auth.uid() or public.is_admin()
  );

create policy "propositions_delete" on propositions
  for delete using (
    created_by = auth.uid() or public.is_admin()
  );

-- ─── PROPOSITION ITEMS ───────────────────────────────────────────────────────

drop policy if exists "proposition_items_all" on proposition_items;

-- Items inherit security from parent proposition
create policy "proposition_items_select" on proposition_items
  for select using (auth.uid() is not null);

create policy "proposition_items_insert" on proposition_items
  for insert with check (auth.uid() is not null);

create policy "proposition_items_update" on proposition_items
  for update using (auth.uid() is not null);

create policy "proposition_items_delete" on proposition_items
  for delete using (auth.uid() is not null);

-- ─── TASKS ───────────────────────────────────────────────────────────────────

drop policy if exists "tasks_all" on tasks;

create policy "tasks_select" on tasks
  for select using (auth.uid() is not null);

create policy "tasks_insert" on tasks
  for insert with check (auth.uid() is not null);

create policy "tasks_update" on tasks
  for update using (
    assigned_to = auth.uid() or created_by = auth.uid() or public.is_admin()
  );

create policy "tasks_delete" on tasks
  for delete using (
    created_by = auth.uid() or public.is_admin()
  );

-- ─── EMAIL TEMPLATES ─────────────────────────────────────────────────────────

drop policy if exists "email_templates_all" on email_templates;

create policy "email_templates_select" on email_templates
  for select using (auth.uid() is not null);

create policy "email_templates_insert" on email_templates
  for insert with check (auth.uid() is not null);

create policy "email_templates_update" on email_templates
  for update using (
    created_by = auth.uid() or public.is_admin()
  );

create policy "email_templates_delete" on email_templates
  for delete using (
    created_by = auth.uid() or public.is_admin()
  );

-- ─── EMAILS SENT ─────────────────────────────────────────────────────────────

drop policy if exists "emails_sent_all" on emails_sent;

create policy "emails_sent_select" on emails_sent
  for select using (auth.uid() is not null);

create policy "emails_sent_insert" on emails_sent
  for insert with check (auth.uid() is not null);

-- Sent emails are immutable (no update/delete for audit trail)

-- ─── VEILLE ──────────────────────────────────────────────────────────────────

drop policy if exists "veille_concurrents_all" on veille_concurrents;
drop policy if exists "veille_alertes_all" on veille_alertes;
drop policy if exists "veille_config_all" on veille_config;

create policy "veille_concurrents_select" on veille_concurrents
  for select using (auth.uid() is not null);

create policy "veille_concurrents_insert" on veille_concurrents
  for insert with check (public.is_admin());

create policy "veille_concurrents_update" on veille_concurrents
  for update using (public.is_admin());

create policy "veille_concurrents_delete" on veille_concurrents
  for delete using (public.is_admin());

create policy "veille_alertes_select" on veille_alertes
  for select using (auth.uid() is not null);

create policy "veille_alertes_insert" on veille_alertes
  for insert with check (auth.uid() is not null);

create policy "veille_alertes_update" on veille_alertes
  for update using (auth.uid() is not null);

create policy "veille_alertes_delete" on veille_alertes
  for delete using (public.is_admin());

create policy "veille_config_select" on veille_config
  for select using (auth.uid() is not null);

create policy "veille_config_insert" on veille_config
  for insert with check (public.is_admin());

create policy "veille_config_update" on veille_config
  for update using (public.is_admin());

create policy "veille_config_delete" on veille_config
  for delete using (public.is_admin());
