-- =============================================================================
-- DAIRIA Sales — Module Intelligence Client
-- =============================================================================

-- Profil enrichi d'un client (lié à un prospect)
create table if not exists client_intelligence (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade not null unique,
  secteur text,
  code_naf text,
  idcc text, -- Identifiant Convention Collective
  idcc_libelle text,
  effectif_tranche text check (effectif_tranche in ('-11', '11-50', '50-250', '250+')) default '-11',
  services_souscrits text[] default '{}',
  services_potentiels text[] default '{}',
  score_opportunite integer default 0,
  notes_internes text,
  updated_at timestamptz default now() not null
);

-- Opportunités détectées par l'IA
create table if not exists opportunites_ia (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade not null,
  type text check (type in ('service_manquant', 'saisonnalite', 'actu_juridique')) not null,
  source text, -- ex: "regle:contentieux_sans_audit" ou "actu:ref_decret"
  titre text not null,
  description text,
  service_propose text not null,
  ca_estime integer default 0, -- en euros HT
  statut text check (statut in ('nouvelle', 'en_cours', 'proposee', 'gagnee', 'perdue', 'ignoree')) default 'nouvelle' not null,
  email_genere text,
  proposition_generee text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Actualités juridiques et leur impact sur les clients
create table if not exists actu_impacts (
  id uuid primary key default gen_random_uuid(),
  source_type text check (source_type in ('decret', 'jurisprudence', 'reforme', 'ccn', 'autre')) not null,
  source_ref text, -- ex: "Cass. soc. 15-01-2026 n°24-12345"
  titre text not null,
  resume text,
  clients_concernes_ids uuid[] default '{}',
  services_concernes text[] default '{}',
  date_publication date,
  created_at timestamptz default now() not null
);

-- Historique des propositions envoyées
create table if not exists propositions_intelligentes (
  id uuid primary key default gen_random_uuid(),
  opportunite_id uuid references opportunites_ia(id) on delete cascade not null,
  prospect_id uuid references prospects(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete set null,
  canal text check (canal in ('email', 'telephone', 'courrier', 'autre')) default 'email' not null,
  date_envoi timestamptz,
  date_ouverture timestamptz,
  resultat text check (resultat in ('en_attente', 'ouvert', 'interesse', 'signe', 'refuse', 'sans_reponse')) default 'en_attente',
  created_at timestamptz default now() not null
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_client_intelligence_prospect on client_intelligence(prospect_id);
create index if not exists idx_client_intelligence_score on client_intelligence(score_opportunite desc);
create index if not exists idx_opportunites_ia_prospect on opportunites_ia(prospect_id);
create index if not exists idx_opportunites_ia_statut on opportunites_ia(statut);
create index if not exists idx_opportunites_ia_created_at on opportunites_ia(created_at desc);
create index if not exists idx_actu_impacts_source_type on actu_impacts(source_type);
create index if not exists idx_actu_impacts_created_at on actu_impacts(created_at desc);
create index if not exists idx_propositions_intelligentes_opportunite on propositions_intelligentes(opportunite_id);

-- =============================================================================
-- RLS
-- =============================================================================

alter table client_intelligence enable row level security;
alter table opportunites_ia enable row level security;
alter table actu_impacts enable row level security;
alter table propositions_intelligentes enable row level security;

create policy "Authenticated users can manage client_intelligence"
  on client_intelligence for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage opportunites_ia"
  on opportunites_ia for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage actu_impacts"
  on actu_impacts for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage propositions_intelligentes"
  on propositions_intelligentes for all to authenticated using (true) with check (true);

-- =============================================================================
-- SEED — Données fictives réalistes
-- =============================================================================

-- 1. Ajouter des prospects si besoin (seed uniquement si table vide)
do $$
declare
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid;
  p6 uuid; p7 uuid; p8 uuid; p9 uuid; p10 uuid;
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid;
begin
  -- Vérifier si des prospects existent déjà
  if (select count(*) from prospects) = 0 then

    insert into prospects (id, company_name, sector, size, score, tags, siren)
    values
      (gen_random_uuid(), 'Transports Dupont SA', 'Transport & Logistique', '50-250', 'chaud', '{"transport","rh"}', '123456789'),
      (gen_random_uuid(), 'BTP Martin & Fils', 'BTP', '11-50', 'tiede', '{"btp","securite"}', '234567890'),
      (gen_random_uuid(), 'PharmaLab Ouest', 'Pharmacie & Santé', '50-250', 'chaud', '{"pharma","conformite"}', '345678901'),
      (gen_random_uuid(), 'TechStart SAS', 'Tech & Numérique', '-11', 'tiede', '{"tech","startup"}', '456789012'),
      (gen_random_uuid(), 'Grande Distribution Leroy', 'Commerce & Distribution', '250+', 'chaud', '{"commerce","rh"}', '567890123'),
      (gen_random_uuid(), 'Cabinet Médical Santé+', 'Santé', '11-50', 'froid', '{"sante","medical"}', '678901234'),
      (gen_random_uuid(), 'Imprimerie Nationale 54', 'Imprimerie', '11-50', 'tiede', '{"imprimerie","ccn"}', '789012345'),
      (gen_random_uuid(), 'Hôtel Lumière Paris', 'Hôtellerie & Restauration', '11-50', 'chaud', '{"hotellerie","rh"}', '890123456'),
      (gen_random_uuid(), 'Assurances Prévoyance Est', 'Assurance & Finance', '50-250', 'tiede', '{"assurance","conformite"}', '901234567'),
      (gen_random_uuid(), 'Agri Coopérative Nord', 'Agriculture', '50-250', 'froid', '{"agriculture","social"}', '012345678')
    ;

  end if;

  -- Récupérer les IDs des 10 premiers prospects
  select id into p1 from prospects order by created_at limit 1 offset 0;
  select id into p2 from prospects order by created_at limit 1 offset 1;
  select id into p3 from prospects order by created_at limit 1 offset 2;
  select id into p4 from prospects order by created_at limit 1 offset 3;
  select id into p5 from prospects order by created_at limit 1 offset 4;
  select id into p6 from prospects order by created_at limit 1 offset 5;
  select id into p7 from prospects order by created_at limit 1 offset 6;
  select id into p8 from prospects order by created_at limit 1 offset 7;
  select id into p9 from prospects order by created_at limit 1 offset 8;
  select id into p10 from prospects order by created_at limit 1 offset 9;

  -- Vérifier si le seed intelligence existe déjà
  if (select count(*) from client_intelligence) > 0 then
    return;
  end if;

  -- 2. Profils enrichis
  insert into client_intelligence (prospect_id, secteur, code_naf, idcc, idcc_libelle, effectif_tranche, services_souscrits, services_potentiels, score_opportunite)
  values
    (p1, 'Transport & Logistique', '4941A', '0016', 'Transports routiers', '50-250',
     array['contentieux','conseil'], array['audit_rh','formation','rgpd'], 78),
    (p2, 'BTP', '4120B', '1597', 'BTP Ouvriers', '11-50',
     array['conseil'], array['contentieux','formation','audit_rh','securite'], 65),
    (p3, 'Pharmacie & Santé', '2110Z', '1996', 'Industries pharmaceutiques', '50-250',
     array['conformite','rgpd'], array['contentieux','audit_rh','formation'], 55),
    (p4, 'Tech & Numérique', '6201Z', '1486', 'Bureaux d''études techniques', '-11',
     array[], array['rgpd','conseil','contrats'], 42),
    (p5, 'Commerce & Distribution', '4711F', '2216', 'Commerce de détail', '250+',
     array['contentieux','formation','conseil'], array['audit_rh','rgpd','nao'], 88),
    (p6, 'Santé', '8621Z', '0843', 'Cabinets médicaux', '11-50',
     array['conseil'], array['rgpd','contentieux'], 35),
    (p7, 'Imprimerie', '1812Z', '0184', 'Imprimerie de labeur', '11-50',
     array['conseil'], array['formation','audit_rh','contentieux'], 48),
    (p8, 'Hôtellerie & Restauration', '5510Z', '1979', 'Hôtels et hébergement', '11-50',
     array['contentieux'], array['formation','audit_rh','rgpd','conseil'], 72),
    (p9, 'Assurance & Finance', '6511Z', '0335', 'Sociétés d''assurance', '50-250',
     array['conformite','conseil','rgpd'], array['contentieux','audit_rh'], 58),
    (p10, 'Agriculture', '0111Z', '7024', 'Exploitations céréalières', '50-250',
     array['conseil'], array['contentieux','formation','securite'], 44)
  ;

  -- 3. Actualités juridiques
  insert into actu_impacts (id, source_type, source_ref, titre, resume, clients_concernes_ids, services_concernes, date_publication)
  values
    (gen_random_uuid(), 'jurisprudence', 'Cass. soc. 12-01-2026 n°24-18432',
     'Harcèlement moral : obligation de résultat renforcée',
     'La Cour de cassation rappelle que l''employeur est tenu d''une obligation de résultat en matière de harcèlement moral. Toute situation de souffrance au travail engage sa responsabilité même en l''absence de faute prouvée.',
     array[p1, p2, p5, p8], array['contentieux','audit_rh','formation'], '2026-01-12'),

    (gen_random_uuid(), 'decret', 'Décret n°2026-34 du 15-01-2026',
     'Entretiens professionnels : nouvelles obligations 2026',
     'Le décret renforce les obligations relatives aux entretiens professionnels pour les entreprises de 50 salariés et plus. État des lieux biennal obligatoire avant le 30 juin 2026.',
     array[p1, p3, p5, p9, p10], array['formation','conseil','audit_rh'], '2026-01-15'),

    (gen_random_uuid(), 'ccn', 'Avenant n°47 CCN Imprimerie du 20-02-2026',
     'Revalorisation des grilles salariales CCN Imprimerie',
     'L''avenant n°47 à la convention collective nationale de l''imprimerie prévoit une revalorisation de 3,2% des minima conventionnels à compter du 1er mars 2026.',
     array[p7], array['conseil','audit_rh'], '2026-02-20'),

    (gen_random_uuid(), 'reforme', 'Loi n°2026-12 du 01-03-2026',
     'Réforme du compte personnel de formation (CPF)',
     'La réforme du CPF impose aux entreprises de plus de 50 salariés une contribution supplémentaire et de nouvelles obligations d''abondement pour les formations en lien avec l''évolution des métiers.',
     array[p1, p3, p5, p9, p10], array['formation','conformite'], '2026-03-01'),

    (gen_random_uuid(), 'jurisprudence', 'CE 10-03-2026 n°472156',
     'Télétravail : accord obligatoire pour plus de 3 jours/semaine',
     'Le Conseil d''État valide la jurisprudence selon laquelle tout télétravail excédant 3 jours par semaine requiert un accord collectif ou une charte unilatérale conforme. Les entreprises non conformes s''exposent à des contentieux.',
     array[p3, p4, p9], array['conseil','contrats','conformite'], '2026-03-10')
  ;

  -- Récupérer les IDs des actus
  select id into a1 from actu_impacts order by created_at limit 1 offset 0;
  select id into a2 from actu_impacts order by created_at limit 1 offset 1;
  select id into a3 from actu_impacts order by created_at limit 1 offset 2;
  select id into a4 from actu_impacts order by created_at limit 1 offset 3;
  select id into a5 from actu_impacts order by created_at limit 1 offset 4;

  -- 4. Opportunités IA
  insert into opportunites_ia (prospect_id, type, source, titre, description, service_propose, ca_estime, statut)
  values
    -- Transports Dupont : contentieux sans audit
    (p1, 'service_manquant', 'regle:contentieux_sans_audit',
     'Audit RH préventif recommandé',
     'Votre client a des contentieux prud''homaux actifs mais n''a pas souscrit à un audit de ses pratiques RH. Un audit préventif permettrait d''identifier et corriger les risques avant qu''ils ne deviennent des litiges.',
     'audit_rh', 4500, 'nouvelle'),

    -- Transports Dupont : NAO janvier
    (p1, 'saisonnalite', 'saisonnalite:nao_janvier',
     'Accompagnement NAO 2026',
     'La période de négociations annuelles obligatoires (NAO) débute en janvier. Avec 50+ salariés, votre client a l''obligation légale d''ouvrir ces négociations sur les salaires et le temps de travail.',
     'nao', 3200, 'proposee'),

    -- BTP Martin : formation obligatoire 11-50
    (p2, 'service_manquant', 'regle:formation_manquante',
     'Plan de formation managers absent',
     'Avec 11 à 50 salariés dans le BTP, votre client est soumis aux obligations de formation à la sécurité et aux entretiens professionnels. Aucune formation n''est référencée dans son profil.',
     'formation', 2800, 'nouvelle'),

    -- BTP Martin : actu harcèlement
    (p2, 'actu_juridique', 'actu:harcelement_cassoc_2026',
     'Impact Cass. soc. jan. 2026 : obligation de résultat harcèlement',
     'La récente jurisprudence renforce les risques pour les entreprises du BTP. Un audit de vos pratiques RH et une formation des encadrants sont fortement recommandés.',
     'audit_rh', 3500, 'nouvelle'),

    -- PharmaLab : entretiens professionnels
    (p3, 'actu_juridique', 'actu:decret_entretiens_pro',
     'Entretiens professionnels : bilan biennal avant juin 2026',
     'Le décret du 15/01/2026 impose un bilan biennal des entretiens professionnels pour les 50+ salariés avant le 30/06/2026. Votre client (secteur pharma, 50-250 sal.) est directement concerné.',
     'formation', 3800, 'nouvelle'),

    -- TechStart : RGPD données sensibles
    (p4, 'service_manquant', 'regle:rgpd_absent',
     'Audit RGPD absent — secteur tech',
     'Une startup tech qui traite des données utilisateurs sans accompagnement RGPD s''expose à des sanctions CNIL. Aucun audit RGPD n''est référencé pour ce client.',
     'rgpd', 2500, 'nouvelle'),

    -- TechStart : télétravail
    (p4, 'actu_juridique', 'actu:teletravail_ce_2026',
     'Accord télétravail obligatoire (CE mars 2026)',
     'Si votre client pratique le télétravail régulier (>3j/sem), la décision du CE du 10/03/2026 impose un accord collectif ou une charte conforme. À régulariser rapidement.',
     'contrats', 1800, 'nouvelle'),

    -- Grande Distribution : audit RH
    (p5, 'service_manquant', 'regle:contentieux_sans_audit',
     'Audit préventif pratiques RH — risque élevé',
     'Avec 250+ salariés et des contentieux actifs, l''absence d''audit RH constitue un risque financier majeur. Les grandes entreprises sont les cibles prioritaires des prud''hommes.',
     'audit_rh', 8500, 'en_cours'),

    -- Grande Distribution : réforme CPF
    (p5, 'actu_juridique', 'actu:reforme_cpf',
     'Réforme CPF 2026 : nouvelles obligations pour 250+ salariés',
     'La loi du 01/03/2026 impose de nouvelles contributions et obligations d''abondement CPF pour les grandes entreprises. Un accompagnement conformité est recommandé.',
     'conformite', 5200, 'nouvelle'),

    -- Hôtel Lumière : audit RH
    (p8, 'service_manquant', 'regle:contentieux_sans_audit',
     'Audit pratiques RH — hôtellerie à risque',
     'Le secteur hôtellerie-restauration est particulièrement exposé aux contentieux prud''homaux (CDD, heures supplémentaires). Un audit préventif est fortement recommandé.',
     'audit_rh', 3200, 'nouvelle'),

    -- Hôtel Lumière : entretiens pro
    (p8, 'saisonnalite', 'saisonnalite:entretiens_mars',
     'Entretiens professionnels annuels — mars 2026',
     'La période de mars est traditionnellement dédiée aux entretiens professionnels. Votre client n''a pas encore de process formalisé.',
     'formation', 2100, 'nouvelle'),

    -- Imprimerie : avenant CCN
    (p7, 'actu_juridique', 'actu:avenant_ccn_imprimerie',
     'Revalorisation salaires CCN Imprimerie — avenant n°47',
     'L''avenant n°47 impose une revalorisation de 3,2% des minima. Votre client doit mettre à jour ses contrats et fiches de paie avant le 1er mars 2026.',
     'conseil', 1500, 'proposee'),

    -- Agri Coopérative : rentrée sociale
    (p10, 'saisonnalite', 'saisonnalite:rentree_sociale',
     'Audit social de rentrée — septembre 2026',
     'La rentrée de septembre est le bon moment pour un bilan social : contrats, temps de travail, accords collectifs. Avec 50-250 salariés, votre client a de nombreuses obligations.',
     'audit_rh', 4000, 'nouvelle'),

    -- Assurances : bilan annuel
    (p9, 'saisonnalite', 'saisonnalite:bilan_annuel',
     'Bilan social annuel + prévisionnel juridique',
     'En fin d''année, un bilan social complet et un prévisionnel des risques juridiques permet d''anticiper sereinement l''année suivante.',
     'conseil', 3500, 'nouvelle'),

    -- Cabinet Médical : RGPD données de santé
    (p6, 'service_manquant', 'regle:rgpd_absent',
     'RGPD données de santé — risque CNIL critique',
     'Les données de santé sont des données sensibles (art. 9 RGPD). Sans accompagnement RGPD, votre client s''expose à des amendes CNIL pouvant atteindre 4% du CA mondial.',
     'rgpd', 3500, 'nouvelle'),

    -- BTP : bilan annuel
    (p2, 'saisonnalite', 'saisonnalite:bilan_annuel',
     'Bilan social annuel BTP',
     'Bilan de fin d''année recommandé pour anticiper les obligations sociales 2026 et les risques identifiés dans l''année.',
     'conseil', 2200, 'nouvelle'),

    -- Grande Distribution : NAO
    (p5, 'saisonnalite', 'saisonnalite:nao_janvier',
     'NAO 2026 — négociations annuelles obligatoires',
     'Avec 250+ salariés, les NAO sont obligatoires. L''accompagnement par un avocat spécialisé réduit les risques de conflits collectifs.',
     'nao', 6500, 'gagnee'),

    -- Transports Dupont : réforme CPF
    (p1, 'actu_juridique', 'actu:reforme_cpf',
     'Réforme CPF — impact secteur transport',
     'La loi sur le CPF impacte directement les entreprises de transport avec des obligations de formation renforcées pour les conducteurs.',
     'formation', 2800, 'nouvelle'),

    -- PharmaLab : harcèlement moral
    (p3, 'actu_juridique', 'actu:harcelement_cassoc_2026',
     'Obligation de résultat harcèlement — pharma',
     'Le secteur pharmaceutique, avec ses équipes commerciales terrain sous pression, est exposé. La jurisprudence récente impose une obligation de résultat renforcée.',
     'formation', 2600, 'nouvelle'),

    -- Assurances : télétravail
    (p9, 'actu_juridique', 'actu:teletravail_ce_2026',
     'Accord télétravail à mettre en conformité',
     'Votre client du secteur assurance pratique largement le télétravail. La décision du CE de mars 2026 impose une mise en conformité des accords existants.',
     'conseil', 2200, 'nouvelle')
  ;

end $$;
