-- =============================================================================
-- DAIRIA Sales — Module Intelligence Client
-- =============================================================================

-- Profil enrichi d'un client (organisation = prospect)
create table if not exists client_intelligence (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  secteur text,
  code_naf text,
  idcc text,
  effectif_tranche text check (effectif_tranche in ('moins_11', '11_50', '50_250', '250_plus')),
  services_souscrits text[] default '{}',
  score_opportunite integer default 0 check (score_opportunite >= 0 and score_opportunite <= 100),
  updated_at timestamptz default now() not null,
  unique (prospect_id)
);

-- Opportunités détectées par l'IA
create table if not exists opportunites_ia (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  type text check (type in ('service_manquant', 'saisonnalite', 'actu_juridique')) not null,
  source text,
  titre text not null,
  description text not null,
  service_propose text not null,
  ca_estime numeric(10,2) default 0,
  statut text check (statut in ('detectee', 'en_cours', 'envoyee', 'convertie', 'ignoree')) default 'detectee' not null,
  email_genere text,
  proposition_generee text,
  created_at timestamptz default now() not null
);

-- Actualités juridiques et leurs impacts sur les clients
create table if not exists actu_impacts (
  id uuid primary key default gen_random_uuid(),
  source_type text check (source_type in ('decret', 'jurisprudence', 'reforme', 'ccn', 'autre')) not null,
  source_ref text,
  titre text not null,
  resume text not null,
  clients_concernes_ids uuid[] default '{}',
  services_concernes text[] default '{}',
  created_at timestamptz default now() not null
);

-- Historique des propositions envoyées depuis l'intelligence
create table if not exists propositions_intelligentes (
  id uuid primary key default gen_random_uuid(),
  opportunite_id uuid not null references opportunites_ia(id) on delete cascade,
  prospect_id uuid not null references prospects(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  canal text check (canal in ('email', 'telephone', 'courrier', 'rdv')) default 'email' not null,
  date_envoi timestamptz,
  date_ouverture timestamptz,
  resultat text check (resultat in ('interesse', 'non_interesse', 'sans_reponse', 'converti')),
  created_at timestamptz default now() not null
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_client_intelligence_prospect_id on client_intelligence(prospect_id);
create index if not exists idx_client_intelligence_score on client_intelligence(score_opportunite desc);
create index if not exists idx_opportunites_ia_prospect_id on opportunites_ia(prospect_id);
create index if not exists idx_opportunites_ia_statut on opportunites_ia(statut);
create index if not exists idx_opportunites_ia_created_at on opportunites_ia(created_at desc);
create index if not exists idx_opportunites_ia_type on opportunites_ia(type);
create index if not exists idx_actu_impacts_source_type on actu_impacts(source_type);
create index if not exists idx_actu_impacts_created_at on actu_impacts(created_at desc);
create index if not exists idx_propositions_intel_opportunite_id on propositions_intelligentes(opportunite_id);
create index if not exists idx_propositions_intel_prospect_id on propositions_intelligentes(prospect_id);

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
-- SEED DATA — 10 clients fictifs réalistes
-- =============================================================================

-- D'abord on s'assure que des prospects existent (seed minimal si besoin)
-- Les clients intelligence seront liés aux prospects existants ou créés ci-dessous

-- Insérer les prospects fictifs (on conflict do nothing si déjà présents)
insert into prospects (id, company_name, siren, sector, size, score, tags) values
  ('a1000000-0000-0000-0000-000000000001', 'Transport Dupont SARL', '123456001', 'Transport & Logistique', '50-250', 'chaud', ARRAY['transport', 'logistique', 'PME']),
  ('a1000000-0000-0000-0000-000000000002', 'BTP Rhône Construction', '123456002', 'BTP & Construction', '50-250', 'chaud', ARRAY['btp', 'construction', 'ETI']),
  ('a1000000-0000-0000-0000-000000000003', 'Pharma Lyon SAS', '123456003', 'Industrie Pharmaceutique', '250+', 'chaud', ARRAY['pharma', 'industrie', 'grande-entreprise']),
  ('a1000000-0000-0000-0000-000000000004', 'TechStart Lyon', '123456004', 'Technologies & Numérique', '11-50', 'tiede', ARRAY['tech', 'startup', 'numérique']),
  ('a1000000-0000-0000-0000-000000000005', 'Clinique Saint-Joseph', '123456005', 'Santé & Médico-social', '250+', 'chaud', ARRAY['santé', 'clinique', 'médico-social']),
  ('a1000000-0000-0000-0000-000000000006', 'Grande Surface Auvergne', '123456006', 'Commerce & Distribution', '50-250', 'tiede', ARRAY['commerce', 'distribution', 'retail']),
  ('a1000000-0000-0000-0000-000000000007', 'Cabinet Expertise Comptable Morin', '123456007', 'Services aux entreprises', '11-50', 'tiede', ARRAY['expertise-comptable', 'services', 'PME']),
  ('a1000000-0000-0000-0000-000000000008', 'Imprimerie Grenoble Impression', '123456008', 'Imprimerie & Édition', '11-50', 'froid', ARRAY['imprimerie', 'édition', 'artisanat']),
  ('a1000000-0000-0000-0000-000000000009', 'École Privée Les Acacias', '123456009', 'Éducation & Formation', '11-50', 'tiede', ARRAY['éducation', 'formation', 'associatif']),
  ('a1000000-0000-0000-0000-000000000010', 'Résidence Senior Harmonie', '123456010', 'Santé & Médico-social', '50-250', 'chaud', ARRAY['ehpad', 'santé', 'médico-social'])
on conflict (id) do nothing;

-- Profils intelligence clients
insert into client_intelligence (prospect_id, secteur, code_naf, idcc, effectif_tranche, services_souscrits, score_opportunite) values
  ('a1000000-0000-0000-0000-000000000001', 'Transport & Logistique', '4941A', '16', '50_250', ARRAY['contentieux', 'conseil_contrats'], 78),
  ('a1000000-0000-0000-0000-000000000002', 'BTP & Construction', '4120A', '1597', '50_250', ARRAY['contentieux'], 85),
  ('a1000000-0000-0000-0000-000000000003', 'Industrie Pharmaceutique', '2120Z', '176', '250_plus', ARRAY['audit_rgpd', 'formation_managers', 'conseil_contrats', 'bilan_social'], 42),
  ('a1000000-0000-0000-0000-000000000004', 'Technologies & Numérique', '6201Z', '2120', '11_50', ARRAY['conseil_contrats'], 65),
  ('a1000000-0000-0000-0000-000000000005', 'Santé & Médico-social', '8610Z', '2264', '250_plus', ARRAY['contentieux', 'formation_managers', 'audit_rgpd'], 55),
  ('a1000000-0000-0000-0000-000000000006', 'Commerce & Distribution', '4711D', '3252', '50_250', ARRAY['conseil_contrats', 'contentieux'], 72),
  ('a1000000-0000-0000-0000-000000000007', 'Services aux entreprises', '6920Z', '787', '11_50', ARRAY['conseil_contrats', 'audit_rgpd'], 38),
  ('a1000000-0000-0000-0000-000000000008', 'Imprimerie & Édition', '1812Z', '548', '11_50', ARRAY['contentieux'], 45),
  ('a1000000-0000-0000-0000-000000000009', 'Éducation & Formation', '8520Z', '2971', '11_50', ARRAY['conseil_contrats'], 30),
  ('a1000000-0000-0000-0000-000000000010', 'Santé & Médico-social', '8710A', '2264', '50_250', ARRAY['contentieux', 'conseil_contrats'], 80)
on conflict (prospect_id) do nothing;

-- =============================================================================
-- SEED DATA — 20 opportunités fictives
-- =============================================================================

insert into opportunites_ia (prospect_id, type, source, titre, description, service_propose, ca_estime, statut) values
  -- Transport Dupont : contentieux sans audit RH
  ('a1000000-0000-0000-0000-000000000001', 'service_manquant', 'regle_contentieux_sans_audit',
   'Audit préventif RH recommandé',
   'Transport Dupont SARL a 3 dossiers contentieux actifs. Un audit préventif des pratiques RH permettrait de réduire significativement le risque de nouveaux litiges.',
   'audit_rh', 4500.00, 'detectee'),
  -- Transport Dupont : 50+ salariés sans formation
  ('a1000000-0000-0000-0000-000000000001', 'service_manquant', 'regle_effectif_formation',
   'Formation managers obligatoire (50+ salariés)',
   'Avec un effectif de 50 à 250 salariés, Transport Dupont est soumis à l''obligation de formation des managers sur la gestion des entretiens professionnels.',
   'formation_managers', 3200.00, 'en_cours'),
  -- BTP Rhône : contentieux sans audit RH
  ('a1000000-0000-0000-0000-000000000002', 'service_manquant', 'regle_contentieux_sans_audit',
   'Audit préventif RH — secteur BTP à risque élevé',
   'BTP Rhône Construction est dans un secteur à fort taux de contentieux prud''homal. L''absence d''audit RH représente un risque significatif.',
   'audit_rh', 5500.00, 'detectee'),
  -- BTP Rhône : formation managers
  ('a1000000-0000-0000-0000-000000000002', 'service_manquant', 'regle_effectif_formation',
   'Formation management sécurité & droit du travail BTP',
   'Le secteur BTP impose des obligations spécifiques en matière de sécurité et droit du travail. Formation recommandée pour les managers de chantier.',
   'formation_managers', 4200.00, 'detectee'),
  -- BTP Rhône : RGPD
  ('a1000000-0000-0000-0000-000000000002', 'service_manquant', 'regle_rgpd',
   'Mise en conformité RGPD — données salariés et sous-traitants',
   'BTP Rhône Construction traite des données personnelles de 180 salariés et nombreux sous-traitants sans audit RGPD formalisé.',
   'audit_rgpd', 2800.00, 'detectee'),
  -- TechStart : RGPD (tech traite données sensibles)
  ('a1000000-0000-0000-0000-000000000004', 'service_manquant', 'regle_rgpd',
   'Audit RGPD prioritaire — startup numérique',
   'TechStart Lyon traite des données utilisateurs dans son application. L''absence d''audit RGPD représente un risque légal et commercial majeur.',
   'audit_rgpd', 3500.00, 'detectee'),
  -- TechStart : CDD nombreux → sécurisation
  ('a1000000-0000-0000-0000-000000000004', 'service_manquant', 'regle_cdd',
   'Sécurisation des contrats CDD développeurs',
   'TechStart Lyon utilise fréquemment des CDD et freelances. Une revue et sécurisation des contrats limiterait le risque de requalification.',
   'securisation_contrats', 2200.00, 'envoyee'),
  -- Grande Surface : NAO janvier
  ('a1000000-0000-0000-0000-000000000006', 'saisonnalite', 'nao_janvier',
   'Accompagnement NAO 2026 — Commerce distribution',
   'Les négociations annuelles obligatoires (NAO) doivent être engagées. DAIRIA peut accompagner Grande Surface Auvergne dans la préparation et la conduite des NAO.',
   'nao', 4800.00, 'convertie'),
  -- Grande Surface : audit RH (contentieux sans audit)
  ('a1000000-0000-0000-0000-000000000006', 'service_manquant', 'regle_contentieux_sans_audit',
   'Audit pratiques RH — secteur distribution',
   'La distribution est un secteur à fort turnover et risque prud''homal élevé. Un audit des pratiques RH est recommandé.',
   'audit_rh', 4200.00, 'detectee'),
  -- Clinique Saint-Joseph : entretiens pro (mars)
  ('a1000000-0000-0000-0000-000000000005', 'saisonnalite', 'entretiens_mars',
   'Préparation campagne entretiens professionnels 2026',
   'La clinique Saint-Joseph doit organiser les entretiens professionnels obligatoires (obligation bisannuelle). Accompagnement recommandé pour 250+ salariés.',
   'entretiens_pro', 6500.00, 'detectee'),
  -- Clinique : bilan social décembre
  ('a1000000-0000-0000-0000-000000000005', 'saisonnalite', 'bilan_decembre',
   'Bilan social 2025 + prévisionnel juridique 2026',
   'Établissement de plus de 250 salariés : obligation de bilan social annuel. Accompagnement pour la préparation et présentation au CSE.',
   'bilan_social', 3800.00, 'ignoree'),
  -- Résidence Senior : audit RH (contentieux)
  ('a1000000-0000-0000-0000-000000000010', 'service_manquant', 'regle_contentieux_sans_audit',
   'Audit RH préventif — secteur EHPAD',
   'Résidence Senior Harmonie a des dossiers contentieux actifs dans un secteur sous tension RH. Un audit préventif est fortement recommandé.',
   'audit_rh', 4800.00, 'detectee'),
  -- Résidence Senior : formation managers
  ('a1000000-0000-0000-0000-000000000010', 'service_manquant', 'regle_effectif_formation',
   'Formation managers EHPAD — gestion RH spécifique',
   'Le secteur médico-social a des contraintes RH spécifiques (temps de travail, astreintes). Formation des managers indispensable.',
   'formation_managers', 3600.00, 'detectee'),
  -- Cabinet Morin : actu jurisprudence
  ('a1000000-0000-0000-0000-000000000007', 'actu_juridique', 'cass_soc_teletravail_2026',
   'Impact Cass. soc. 15/01/2026 — télétravail',
   'La récente jurisprudence de la Cour de cassation sur le télétravail impose une révision des accords existants. Cabinet Morin emploie 30% de télétravailleurs.',
   'conseil_contrats', 2500.00, 'detectee'),
  -- École Les Acacias : actu décret entretiens pro
  ('a1000000-0000-0000-0000-000000000009', 'actu_juridique', 'decret_entretiens_2026',
   'Décret entretiens professionnels — mise en conformité',
   'Le décret du 10/02/2026 renforce les obligations d''entretiens professionnels dans l''éducation privée. Mise en conformité requise.',
   'entretiens_pro', 1800.00, 'detectee'),
  -- Imprimerie Grenoble : CCN modifiée
  ('a1000000-0000-0000-0000-000000000008', 'actu_juridique', 'ccn_548_avenant_2026',
   'Avenant CCN Imprimerie (IDCC 548) — Mise à jour obligatoire',
   'L''avenant du 01/03/2026 à la CCN de l''imprimerie modifie les grilles de salaires et les congés. Mise à jour des contrats nécessaire.',
   'conseil_contrats', 2200.00, 'en_cours'),
  -- Pharma Lyon : rentrée sociale
  ('a1000000-0000-0000-0000-000000000003', 'saisonnalite', 'rentree_sociale',
   'Audit social de rentrée 2026 — Industrie pharmaceutique',
   'Avec la rentrée sociale, Pharma Lyon SAS bénéficierait d''un audit complet de sa conformité sociale pour anticiper les contrôles URSSAF.',
   'rentree_sociale', 5200.00, 'ignoree'),
  -- BTP Rhône : réforme retraites
  ('a1000000-0000-0000-0000-000000000002', 'actu_juridique', 'reforme_retraites_2026',
   'Information collective — Réforme retraites 2026',
   'La réforme des retraites promulguée en janvier 2026 impacte les droits de vos salariés du BTP. Session d''information collective recommandée.',
   'info_collective', 3000.00, 'detectee'),
  -- Transport Dupont : bareme Macron
  ('a1000000-0000-0000-0000-000000000001', 'actu_juridique', 'bareme_macron_update',
   'Nouveau barème Macron — Optimisation dossiers licenciement',
   'La mise à jour du barème Macron en février 2026 modifie les indemnités de licenciement. Impact sur les 2 dossiers en cours chez Transport Dupont.',
   'contentieux', 1500.00, 'detectee'),
  -- Grande Surface : formation
  ('a1000000-0000-0000-0000-000000000006', 'service_manquant', 'regle_effectif_formation',
   'Formation managers — Commerce & Distribution',
   'Grande Surface Auvergne n''a pas encore intégré le programme de formation obligatoire pour ses managers de rayon (obligation post-NAO).',
   'formation_managers', 3800.00, 'detectee')
on conflict do nothing;

-- =============================================================================
-- SEED DATA — 5 actualités juridiques récentes
-- =============================================================================

insert into actu_impacts (source_type, source_ref, titre, resume, clients_concernes_ids, services_concernes) values
  (
    'jurisprudence',
    'Cass. soc. 15 janvier 2026, n°24-15.328',
    'Télétravail : la Cour de cassation précise les obligations de l''employeur',
    'La Cour de cassation a jugé que l''employeur doit formaliser par écrit toute modalité de télétravail, même ponctuelle, sous peine de requalification en avantage acquis. Les entreprises utilisant le télétravail de façon informelle doivent régulariser leurs pratiques.',
    ARRAY['a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007']::uuid[],
    ARRAY['conseil_contrats']
  ),
  (
    'decret',
    'Décret n°2026-189 du 10 février 2026',
    'Entretiens professionnels : nouvelles obligations documentaires',
    'Le décret renforce les obligations de traçabilité des entretiens professionnels et impose la remise d''un document de synthèse signé par le salarié. Les établissements de plus de 11 salariés doivent se mettre en conformité avant le 1er juillet 2026.',
    ARRAY['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000010']::uuid[],
    ARRAY['entretiens_pro', 'formation_managers']
  ),
  (
    'ccn',
    'Avenant n°47 du 01 mars 2026 — CCN Imprimerie IDCC 548',
    'Convention collective Imprimerie : revalorisation des salaires minima',
    'L''avenant n°47 à la convention collective nationale de l''imprimerie revalorises les salaires minima de 3,2% et introduit une nouvelle grille de classification des emplois. Applicable au 1er avril 2026.',
    ARRAY['a1000000-0000-0000-0000-000000000008']::uuid[],
    ARRAY['conseil_contrats']
  ),
  (
    'reforme',
    'Loi n°2026-55 du 28 janvier 2026',
    'Réforme des retraites : impact sur les régimes spéciaux BTP et transport',
    'La loi du 28 janvier 2026 modifie les conditions de départ en retraite pour les salariés exposés à des travaux pénibles, impactant directement le BTP et le transport. Les entreprises doivent mettre à jour leurs registres de pénibilité et informer leurs salariés.',
    ARRAY['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002']::uuid[],
    ARRAY['info_collective', 'conseil_contrats']
  ),
  (
    'jurisprudence',
    'Cass. soc. 04 mars 2026, n°24-18.445',
    'Harcèlement moral : durcissement de la responsabilité de l''employeur',
    'La Cour de cassation confirme que la responsabilité de l''employeur est engagée dès lors qu''il avait connaissance de faits de harcèlement, même sans saisine formelle. Les entreprises sans politique de prévention du harcèlement s''exposent à une responsabilité automatique.',
    ARRAY['a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002']::uuid[],
    ARRAY['audit_rh', 'formation_managers']
  )
on conflict do nothing;
