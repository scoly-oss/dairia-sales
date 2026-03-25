-- =============================================================================
-- DAIRIA Sales — Module Intelligence Client (Migration 002)
-- =============================================================================

-- Profil enrichi par client (prospect)
create table if not exists client_intelligence (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade unique not null,
  secteur text,
  code_naf text,
  idcc text,
  effectif_tranche text check (effectif_tranche in ('moins_11', 'de_11_50', 'de_50_250', 'plus_250')) default 'moins_11' not null,
  services_souscrits text[] default '{}' not null,
  score_opportunite integer default 0 check (score_opportunite >= 0 and score_opportunite <= 100) not null,
  updated_at timestamptz default now() not null
);

-- Opportunités générées par l'IA
create table if not exists opportunites_ia (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade not null,
  type text check (type in ('service_manquant', 'actu_juridique', 'saisonnalite')) not null,
  source text not null,
  titre text not null,
  description text not null,
  service_propose text not null,
  ca_estime numeric(12,2) default 0 not null,
  statut text check (statut in ('nouvelle', 'vue', 'proposee', 'acceptee', 'refusee', 'expiree')) default 'nouvelle' not null,
  email_genere text,
  proposition_generee text,
  created_at timestamptz default now() not null
);

-- Actualités juridiques et leur impact clients
create table if not exists actu_impacts (
  id uuid primary key default gen_random_uuid(),
  source_type text check (source_type in ('decret', 'jurisprudence', 'reforme', 'loi', 'circulaire')) not null,
  source_ref text not null,
  titre text not null,
  resume text not null,
  clients_concernes_ids uuid[] default '{}' not null,
  services_concernes text[] default '{}' not null,
  created_at timestamptz default now() not null
);

-- Propositions envoyées suite aux opportunités IA
create table if not exists propositions_intelligentes (
  id uuid primary key default gen_random_uuid(),
  opportunite_id uuid references opportunites_ia(id) on delete cascade not null,
  prospect_id uuid references prospects(id) on delete cascade not null,
  canal text check (canal in ('email', 'courrier', 'telephone', 'presentiel')) default 'email' not null,
  date_envoi timestamptz default now() not null,
  date_ouverture timestamptz,
  resultat text check (resultat in ('en_attente', 'interesse', 'refuse', 'converti')) default 'en_attente' not null
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_client_intelligence_prospect on client_intelligence(prospect_id);
create index if not exists idx_opportunites_ia_prospect on opportunites_ia(prospect_id);
create index if not exists idx_opportunites_ia_statut on opportunites_ia(statut);
create index if not exists idx_opportunites_ia_created on opportunites_ia(created_at desc);
create index if not exists idx_actu_impacts_created on actu_impacts(created_at desc);
create index if not exists idx_propositions_intel_opp on propositions_intelligentes(opportunite_id);
create index if not exists idx_propositions_intel_prospect on propositions_intelligentes(prospect_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table client_intelligence enable row level security;
alter table opportunites_ia enable row level security;
alter table actu_impacts enable row level security;
alter table propositions_intelligentes enable row level security;

create policy "client_intelligence_all" on client_intelligence for all using (auth.uid() is not null);
create policy "opportunites_ia_all" on opportunites_ia for all using (auth.uid() is not null);
create policy "actu_impacts_all" on actu_impacts for all using (auth.uid() is not null);
create policy "propositions_intelligentes_all" on propositions_intelligentes for all using (auth.uid() is not null);

-- =============================================================================
-- SEED DATA — 10 Clients fictifs réalistes
-- =============================================================================

insert into prospects (id, company_name, siren, sector, size, score, tags) values
  ('a1000000-0000-0000-0000-000000000001', 'TRANSPORT LECONTE SAS', '491234567', 'Transport & Logistique', '50-250', 'chaud', ARRAY['transport', 'social']),
  ('a1000000-0000-0000-0000-000000000002', 'BOULANGERIE DUPAIN & FILS', '382345678', 'Agroalimentaire', '11-50', 'tiede', ARRAY['artisan', 'alimentaire']),
  ('a1000000-0000-0000-0000-000000000003', 'TECH SOLUTIONS PARIS SAS', '503456789', 'Informatique & Tech', '50-250', 'chaud', ARRAY['tech', 'saas']),
  ('a1000000-0000-0000-0000-000000000004', 'CABINET MÉDICAL VOLTAIRE', '214567890', 'Santé', '11-50', 'tiede', ARRAY['médical', 'santé']),
  ('a1000000-0000-0000-0000-000000000005', 'CONSTRUCTIONS MOREAU FRÈRES', '345678901', 'BTP', '50-250', 'chaud', ARRAY['btp', 'construction']),
  ('a1000000-0000-0000-0000-000000000006', 'RESTAURANT LE MIDI SARL', '456789012', 'Restauration', '11-50', 'froid', ARRAY['restauration', 'hôtellerie']),
  ('a1000000-0000-0000-0000-000000000007', 'IMMO CONSEIL GROUP', '567890123', 'Immobilier', '< 11', 'tiede', ARRAY['immobilier']),
  ('a1000000-0000-0000-0000-000000000008', 'PHARMA PLUS DISTRIBUTION', '678901234', 'Distribution pharmaceutique', '50-250', 'chaud', ARRAY['pharma', 'distribution']),
  ('a1000000-0000-0000-0000-000000000009', 'TEXTILE INNOVATION SA', '789012345', 'Industrie textile', '11-50', 'tiede', ARRAY['industrie', 'textile']),
  ('a1000000-0000-0000-0000-000000000010', 'AGENCE DIGITALE CLICK', '890123456', 'Marketing & Communication', '11-50', 'froid', ARRAY['digital', 'marketing'])
on conflict (id) do nothing;

insert into contacts (prospect_id, name, email, phone, "function", is_primary) values
  ('a1000000-0000-0000-0000-000000000001', 'Jean-Pierre Leconte', 'jp.leconte@transport-leconte.fr', '06 12 34 56 78', 'PDG', true),
  ('a1000000-0000-0000-0000-000000000002', 'Marie Dupain', 'm.dupain@boulangerie-dupain.fr', '06 23 45 67 89', 'Gérante', true),
  ('a1000000-0000-0000-0000-000000000003', 'Sophie Martin', 's.martin@tech-solutions-paris.fr', '07 34 56 78 90', 'DRH', true),
  ('a1000000-0000-0000-0000-000000000004', 'Dr. Antoine Voltaire', 'a.voltaire@cabinet-voltaire.fr', '06 45 67 89 01', 'Directeur médical', true),
  ('a1000000-0000-0000-0000-000000000005', 'Pierre Moreau', 'p.moreau@constructions-moreau.fr', '06 56 78 90 12', 'Directeur général', true),
  ('a1000000-0000-0000-0000-000000000006', 'Fatima Benali', 'f.benali@lemidi-restaurant.fr', '07 67 89 01 23', 'Gérante', true),
  ('a1000000-0000-0000-0000-000000000007', 'Thomas Renard', 't.renard@immo-conseil.fr', '06 78 90 12 34', 'Associé gérant', true),
  ('a1000000-0000-0000-0000-000000000008', 'Isabelle Chevalier', 'i.chevalier@pharma-plus.fr', '07 89 01 23 45', 'Directrice juridique', true),
  ('a1000000-0000-0000-0000-000000000009', 'Claude Bertrand', 'c.bertrand@textile-innovation.fr', '06 90 12 34 56', 'PDG', true),
  ('a1000000-0000-0000-0000-000000000010', 'Lucas Fontaine', 'l.fontaine@agence-click.fr', '07 01 23 45 67', 'CEO', true)
on conflict do nothing;

-- Profils d'intelligence client (10)
insert into client_intelligence (id, prospect_id, secteur, code_naf, idcc, effectif_tranche, services_souscrits, score_opportunite) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Transport routier de marchandises', '4941A', '16', 'de_50_250', ARRAY['contentieux', 'conseil'], 72),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Boulangerie-pâtisserie', '1071A', '843', 'de_11_50', ARRAY['conseil'], 55),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Programmation informatique', '6201Z', '1486', 'de_50_250', ARRAY['conformite'], 68),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'Activités hospitalières', '8621Z', '2204', 'de_11_50', ARRAY['contentieux', 'conformite'], 45),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'Construction de bâtiments résidentiels', '4120A', '1596', 'de_50_250', ARRAY['audit', 'contentieux'], 80),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'Restauration traditionnelle', '5610A', '1979', 'de_11_50', ARRAY[]::text[], 90),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'Agences immobilières', '6832A', '1527', 'moins_11', ARRAY['conseil'], 30),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'Commerce de gros produits pharmaceutiques', '4646Z', '1044', 'de_50_250', ARRAY['contentieux', 'conformite', 'audit'], 50),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 'Fabrication d''articles textiles', '1392Z', '18', 'de_11_50', ARRAY['formation', 'conseil'], 60),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010', 'Conseil en publicité', '7311Z', '2247', 'de_11_50', ARRAY['conformite'], 55)
on conflict (id) do nothing;

-- 5 Actualités juridiques récentes
insert into actu_impacts (id, source_type, source_ref, titre, resume, clients_concernes_ids, services_concernes, created_at) values
  (
    'd1000000-0000-0000-0000-000000000001',
    'decret',
    'Décret n°2026-142 du 15 janv. 2026',
    'Nouveau décret sur les entretiens professionnels obligatoires',
    'Le décret 2026-142 renforce les obligations d''entretien professionnel pour les entreprises de 50 salariés et plus. Désormais, chaque salarié doit bénéficier d''un entretien tous les 2 ans, sous peine d''une contribution supplémentaire à l''OPCO de 3 000 € par salarié concerné.',
    ARRAY['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000008']::uuid[],
    ARRAY['formation', 'conseil'],
    now() - interval '10 days'
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'jurisprudence',
    'Cass. soc. 12 févr. 2026, n°24-15.892',
    'Harcèlement moral étendu au management par objectifs excessifs',
    'La Chambre sociale de la Cour de Cassation étend la notion de harcèlement moral aux pratiques de management par objectifs excessifs. Toute entreprise ayant eu des arrêts maladie liés au stress ou des contentieux sociaux récents doit auditer ses pratiques RH.',
    ARRAY['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005']::uuid[],
    ARRAY['audit', 'contentieux'],
    now() - interval '5 days'
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'reforme',
    'LOI n°2025-1896 du 22 déc. 2025',
    'Réforme du barème Macron : plafonds d''indemnisation relevés',
    'La loi du 22 décembre 2025 revoit à la hausse les plafonds d''indemnisation du barème Macron pour licenciement sans cause réelle et sérieuse. Les entreprises ayant des contentieux prud''homaux en cours ou des procédures de licenciement doivent réévaluer leur exposition financière.',
    ARRAY['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000008']::uuid[],
    ARRAY['contentieux', 'conseil'],
    now() - interval '30 days'
  ),
  (
    'd1000000-0000-0000-0000-000000000004',
    'loi',
    'Avenant n°12 CCN Transport routier (IDCC 16) — 1er mars 2026',
    'Modification de la Convention Collective du Transport Routier (IDCC 16)',
    'L''avenant n°12 à la CCN du transport routier (IDCC 16) modifie les grilles de salaires et les temps de repos. Entrée en vigueur au 1er avril 2026. Les entreprises du transport routier doivent mettre à jour leurs contrats et bulletins de paie avant cette date.',
    ARRAY['a1000000-0000-0000-0000-000000000001']::uuid[],
    ARRAY['conseil', 'conformite'],
    now() - interval '2 days'
  ),
  (
    'd1000000-0000-0000-0000-000000000005',
    'circulaire',
    'Circulaire DARES 2026-08 du 1er mars 2026',
    'Nouvelles obligations RGPD pour les données de santé au travail',
    'La circulaire DARES 2026-08 précise les nouvelles obligations RGPD applicables aux données de santé collectées dans le cadre de la médecine du travail. Toutes les entreprises sont concernées et doivent mettre à jour leur registre des traitements avant le 30 juin 2026.',
    ARRAY['a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000010']::uuid[],
    ARRAY['conformite'],
    now() - interval '1 day'
  )
on conflict (id) do nothing;

-- 20 Opportunités IA seed
insert into opportunites_ia (id, prospect_id, type, source, titre, description, service_propose, ca_estime, statut, created_at) values
  -- Transport Leconte (3)
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'service_manquant', 'Contentieux actifs sans audit RH préventif', 'Audit préventif RH — Transport Leconte', 'Transport Leconte SAS dispose de contentieux prud''homaux actifs mais n''a pas réalisé d''audit préventif de ses pratiques RH. Un audit permettrait d''identifier les risques résiduels et de sécuriser les pratiques managériales.', 'audit', 3500, 'nouvelle', now() - interval '3 days'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'actu_juridique', 'Actu juridique: Décret n°2026-142 du 15 janv. 2026', 'Impact Décret 2026-142 — Entretiens professionnels', 'Le décret 2026-142 impose de nouveaux standards pour les entretiens professionnels. Transport Leconte (50-250 salariés) doit mettre en conformité ses pratiques avant échéance légale pour éviter une contribution supplémentaire à l''OPCO.', 'formation', 2000, 'vue', now() - interval '10 days'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'saisonnalite', 'Saisonnalité mars — Entretiens professionnels', 'Formation managers — Conduite d''entretiens', 'La période des entretiens annuels approche. Nous proposons une formation pratique aux managers de Transport Leconte pour conduire des entretiens conformes aux exigences légales.', 'formation', 2000, 'proposee', now() - interval '15 days'),
  -- Boulangerie Dupain (2)
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'service_manquant', 'Absence de mise en conformité RGPD', 'Audit RGPD — Boulangerie Dupain & Fils', 'La Boulangerie Dupain & Fils collecte des données clients (fidélité, commandes) sans conformité RGPD documentée. Risque de sanction CNIL jusqu''à 4% du CA mondial.', 'conformite', 3500, 'nouvelle', now() - interval '1 day'),
  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'actu_juridique', 'Actu juridique: Circulaire DARES 2026-08 du 1er mars 2026', 'RGPD Santé au Travail — Boulangerie Dupain', 'La circulaire DARES 2026-08 impose une mise à jour du registre des traitements pour les données de santé. Boulangerie Dupain doit se mettre en conformité avant le 30 juin 2026.', 'conformite', 2500, 'nouvelle', now() - interval '1 day'),
  -- Tech Solutions (3)
  ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'service_manquant', 'Effectif 50+ sans formation obligatoire', 'Formation managers obligatoire — Tech Solutions Paris', 'Tech Solutions Paris (50-250 salariés) n''a pas encore souscrit de programme de formation managers malgré ses obligations légales. Un programme CPF peut couvrir une partie des coûts.', 'formation', 4000, 'nouvelle', now() - interval '2 days'),
  ('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'service_manquant', 'Contentieux actifs sans audit RH préventif', 'Audit pratiques RH — Tech Solutions Paris', 'Malgré la croissance rapide de Tech Solutions Paris, aucun audit des pratiques RH n''a été réalisé. L''absence d''audit expose l''entreprise à des contentieux liés aux conditions de travail.', 'audit', 3500, 'vue', now() - interval '7 days'),
  ('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', 'actu_juridique', 'Actu juridique: Cass. soc. 12 févr. 2026, n°24-15.892', 'Impact Jurisprudence Harcèlement — Tech Solutions Paris', 'La récente jurisprudence sur le management par objectifs expose Tech Solutions Paris. Les méthodes OKR intensives pratiquées peuvent être requalifiées en harcèlement moral.', 'audit', 3500, 'nouvelle', now() - interval '5 days'),
  -- Cabinet Médical (2)
  ('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000004', 'service_manquant', 'Effectif 11-50 sans formation', 'Formation droit médical du travail — Cabinet Voltaire', 'Le Cabinet Médical Voltaire emploie du personnel soignant sans programme de formation sur le droit du travail en milieu médical. Les obligations légales d''information des patients évoluent régulièrement.', 'formation', 2000, 'nouvelle', now() - interval '4 days'),
  ('c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000004', 'actu_juridique', 'Actu juridique: Circulaire DARES 2026-08 du 1er mars 2026', 'RGPD Données de santé — Cabinet Médical Voltaire', 'En tant que structure de santé, le Cabinet Voltaire est particulièrement concerné par la circulaire DARES 2026-08. Mise à jour urgente du registre RGPD requise avant le 30 juin 2026.', 'conformite', 4000, 'nouvelle', now() - interval '1 day'),
  -- Constructions Moreau (3)
  ('c1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000005', 'service_manquant', 'Absence de mise en conformité RGPD', 'Mise en conformité RGPD — Constructions Moreau', 'Constructions Moreau Frères collecte des données sur ses sous-traitants et clients sans programme RGPD formalisé. Risque accru avec le développement digital de l''entreprise.', 'conformite', 3500, 'nouvelle', now() - interval '6 days'),
  ('c1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000005', 'service_manquant', 'Effectif 50+ sans formation obligatoire', 'Formation management BTP — Constructions Moreau', 'Les chefs de chantier de Constructions Moreau manquent de formation sur le droit du travail spécifique au BTP (sous-traitance, accidents du travail). Risque prud''homal élevé dans ce secteur.', 'formation', 4000, 'acceptee', now() - interval '20 days'),
  ('c1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000005', 'actu_juridique', 'Actu juridique: Cass. soc. 12 févr. 2026, n°24-15.892', 'Impact Jurisprudence Harcèlement — Constructions Moreau', 'La jurisprudence sur le harcèlement par objectifs concerne les chefs de projet BTP soumis à forte pression de résultat chez Constructions Moreau Frères.', 'audit', 2800, 'nouvelle', now() - interval '5 days'),
  -- Restaurant Le Midi (3)
  ('c1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000006', 'service_manquant', 'Absence de mise en conformité RGPD', 'Audit RGPD complet — Restaurant Le Midi', 'Le Restaurant Le Midi n''a aucun accompagnement juridique. Application de fidélité, données bancaires clients : le risque RGPD est maximum. Mise en conformité urgente nécessaire.', 'conformite', 3500, 'nouvelle', now() - interval '2 days'),
  ('c1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000006', 'service_manquant', 'Recours aux CDD sans sécurisation contractuelle', 'Sécurisation contrats saisonniers — Restaurant Le Midi', 'Le Restaurant Le Midi emploie de nombreux extras et saisonniers sur CDD. Sans sécurisation contractuelle, le risque de requalification en CDI est élevé (secteur restauration très contrôlé par l''inspection du travail).', 'conseil', 2500, 'nouvelle', now() - interval '2 days'),
  ('c1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000006', 'actu_juridique', 'Actu juridique: Circulaire DARES 2026-08 du 1er mars 2026', 'RGPD Santé au Travail — Restaurant Le Midi', 'La circulaire DARES 2026-08 s''applique également à la restauration. Le Midi doit mettre en conformité ses données RH de santé avant le 30 juin 2026.', 'conformite', 2500, 'nouvelle', now() - interval '1 day'),
  -- Pharma Plus (1)
  ('c1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000008', 'service_manquant', 'Effectif 50+ sans formation obligatoire', 'Formation compliance pharma — Pharma Plus Distribution', 'Pharma Plus Distribution (50-250 salariés) n''a pas de programme de formation sur la conformité réglementaire pharmaceutique et les obligations sociales liées à ce secteur très réglementé.', 'formation', 4500, 'nouvelle', now() - interval '3 days'),
  -- Textile Innovation (2)
  ('c1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000009', 'service_manquant', 'Absence de mise en conformité RGPD', 'Audit RGPD — Textile Innovation', 'Textile Innovation SA traite des données de ses partenaires internationaux sans programme RGPD. Le règlement s''applique dès lors que des données de résidents européens sont traitées.', 'conformite', 3500, 'nouvelle', now() - interval '4 days'),
  ('c1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000009', 'actu_juridique', 'Actu juridique: Circulaire DARES 2026-08 du 1er mars 2026', 'RGPD Santé au Travail — Textile Innovation', 'La circulaire DARES 2026-08 impose une mise à jour du registre des traitements pour les données de santé. Textile Innovation doit agir avant le 30 juin 2026.', 'conformite', 2500, 'nouvelle', now() - interval '1 day'),
  -- Agence Click (1)
  ('c1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000010', 'service_manquant', 'Recours aux CDD sans sécurisation contractuelle', 'Sécurisation contrats freelances — Agence Digitale Click', 'L''Agence Digitale Click fait largement appel à des freelances et prestataires externes. L''absence de contrats adaptés expose l''agence à des risques de requalification en CDI (présomption de salariat numérique).', 'conseil', 2000, 'nouvelle', now() - interval '6 days')
on conflict (id) do nothing;

-- Propositions intelligentes déjà envoyées (exemples)
insert into propositions_intelligentes (opportunite_id, prospect_id, canal, date_envoi, date_ouverture, resultat) values
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'email', now() - interval '12 days', now() - interval '11 days', 'interesse'),
  ('c1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000005', 'email', now() - interval '18 days', now() - interval '17 days', 'converti')
on conflict do nothing;
