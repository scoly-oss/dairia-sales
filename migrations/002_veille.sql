-- =============================================================================
-- DAIRIA Sales — Module Veille Stratégique
-- =============================================================================

-- Concurrents suivis
create table if not exists veille_concurrents (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text check (type in ('cabinet', 'legaltech', 'saas')) not null,
  secteur text,
  site_web text,
  notes text,
  forces text[] default '{}',
  faiblesses text[] default '{}',
  created_at timestamptz default now() not null
);

-- Alertes de veille
create table if not exists veille_alertes (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('concurrentielle', 'marche', 'reputation')) not null,
  categorie text check (categorie in ('cabinet', 'legaltech', 'atmp', 'opportunite', 'mention', 'avis', 'presse')) not null,
  titre text not null,
  resume text,
  source_url text,
  sentiment text check (sentiment in ('positif', 'neutre', 'negatif')),
  importance text check (importance in ('faible', 'normale', 'haute')) default 'normale' not null,
  prospect_id uuid references prospects(id) on delete set null,
  lu boolean default false not null,
  archive boolean default false not null,
  created_at timestamptz default now() not null
);

-- Configuration de la veille
create table if not exists veille_config (
  id uuid primary key default gen_random_uuid(),
  mots_cles text[] default '{}',
  sources text[] default '{}',
  frequence text check (frequence in ('quotidienne', 'hebdomadaire', 'mensuelle')) default 'quotidienne' not null,
  actif boolean default true not null
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_veille_alertes_type on veille_alertes(type);
create index if not exists idx_veille_alertes_lu on veille_alertes(lu);
create index if not exists idx_veille_alertes_archive on veille_alertes(archive);
create index if not exists idx_veille_alertes_created_at on veille_alertes(created_at desc);
create index if not exists idx_veille_alertes_importance on veille_alertes(importance);
create index if not exists idx_veille_concurrents_type on veille_concurrents(type);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table veille_concurrents enable row level security;
alter table veille_alertes enable row level security;
alter table veille_config enable row level security;

create policy "veille_concurrents_all" on veille_concurrents for all using (auth.uid() is not null);
create policy "veille_alertes_all" on veille_alertes for all using (auth.uid() is not null);
create policy "veille_config_all" on veille_config for all using (auth.uid() is not null);

-- =============================================================================
-- SEED DATA — Concurrents cabinets d'avocats Lyon
-- =============================================================================

insert into veille_concurrents (nom, type, secteur, site_web, notes, forces, faiblesses) values
  (
    'Capstan Avocats',
    'cabinet',
    'Droit social',
    'https://www.capstan.fr',
    'Cabinet national leader en droit social, 200+ avocats, forte présence Lyon',
    ARRAY['Notoriété nationale', 'Réseau clients grands comptes', 'Expertise contentieux prud''homal'],
    ARRAY['Tarifs élevés PME', 'Moins agile que DAIRIA sur le digital', 'Approche peu personnalisée']
  ),
  (
    'Flichy Grangé Avocats',
    'cabinet',
    'Droit social',
    'https://www.flichygrange.com',
    'Cabinet parisien avec bureau Lyon, spécialiste droit social et RH',
    ARRAY['Expertise pointue droit du travail', 'Publications et doctrine reconnues'],
    ARRAY['Présence Lyon limitée', 'Peu orienté numérique', 'Moins de services préventifs']
  ),
  (
    'ACTEIS Avocats Lyon',
    'cabinet',
    'Droit des affaires / social',
    'https://www.acteis.fr',
    'Cabinet lyonnais pluridisciplinaire, actif sur le marché PME/ETI local',
    ARRAY['Ancrage local fort', 'Prix compétitifs PME', 'Relation client proximité'],
    ARRAY['Moins de notoriété nationale', 'Équipe plus restreinte', 'Moins de tech']
  ),
  (
    'Barthelemy Avocats',
    'cabinet',
    'Droit social',
    'https://www.barthelemy-avocats.com',
    'Réseau national de cabinets en droit social, bureau Lyon actif',
    ARRAY['Réseau national', 'Tarifs accessibles', 'Bonne couverture régionale'],
    ARRAY['Qualité variable selon bureau', 'Peu d''innovation digitale']
  ),
  (
    'Woods Avocats',
    'cabinet',
    'Droit social / pénal des affaires',
    'https://www.woods-avocats.fr',
    'Cabinet lyonnais spécialisé droit social, repositionnement PME en cours',
    ARRAY['Spécialisation sectorielle', 'Bonne réputation Lyon'],
    ARRAY['Taille modeste', 'Pas de solution digitale intégrée']
  )
on conflict do nothing;

-- Legaltechs concurrentes de DAIRIA IA
insert into veille_concurrents (nom, type, secteur, site_web, notes, forces, faiblesses) values
  (
    'Doctrine',
    'legaltech',
    'Recherche juridique IA',
    'https://www.doctrine.fr',
    'Plateforme de recherche juridique IA, leader français, 100k+ utilisateurs avocats',
    ARRAY['Leader marché France', 'Base jurisprudence exhaustive', 'Financement solide (50M€)'],
    ARRAY['Pas de CRM intégré', 'Pas de gestion AT/MP', 'Prix élevé cabinets solo']
  ),
  (
    'Hyperlex',
    'legaltech',
    'Gestion contrats IA',
    'https://www.hyperlex.ai',
    'IA de gestion et analyse de contrats, cible juristes entreprise',
    ARRAY['Automatisation contrats poussée', 'Intégrations entreprise'],
    ARRAY['Pas orienté cabinet avocat', 'Pas de spécialisation droit social', 'Pas d''AT/MP']
  ),
  (
    'Prevaj / WTW Legal',
    'saas',
    'Gestion prévoyance AT/MP',
    'https://www.willistowerswatson.com',
    'Module de gestion AT/MP intégré dans la suite RH WTW, concurrent direct GererMesATMP',
    ARRAY['Marque groupe internationale', 'Intégration SIRH', 'Réseau grands comptes'],
    ARRAY['Prix enterprise inaccessible PME', 'Complexité d''implémentation', 'Support lent']
  )
on conflict do nothing;

-- =============================================================================
-- SEED DATA — Alertes de veille fictives
-- =============================================================================

insert into veille_alertes (type, categorie, titre, resume, source_url, sentiment, importance, lu, archive) values
  (
    'concurrentielle',
    'cabinet',
    'Capstan Avocats ouvre un 3ème bureau à Lyon',
    'Le cabinet Capstan Avocats annonce l''ouverture d''un nouveau bureau dans le 2ème arrondissement de Lyon, renforçant sa présence dans la région Auvergne-Rhône-Alpes avec 5 avocats supplémentaires spécialisés en contentieux social.',
    'https://www.capstan.fr/actualites/ouverture-bureau-lyon',
    'negatif',
    'haute',
    false,
    false
  ),
  (
    'concurrentielle',
    'legaltech',
    'Doctrine lève 30M€ supplémentaires — Série C',
    'La legaltech Doctrine annonce une levée de fonds de 30M€ en Série C pour accélérer son développement en Europe et enrichir ses fonctionnalités d''IA générative pour la recherche jurisprudentielle.',
    'https://www.doctrine.fr/presse/serie-c-2025',
    'negatif',
    'haute',
    false,
    false
  ),
  (
    'marche',
    'opportunite',
    'PSE chez Léa Nature (300 salariés) — Besoin avocat droit social',
    'La société Léa Nature (Saint-Vit, 300 salariés) a annoncé un plan de sauvegarde de l''emploi suite à des difficultés financières. Opportunité commerciale identifiée pour assistance PSE et contentieux prud''homal.',
    'https://www.lesechos.fr/lea-nature-pse-2025',
    'neutre',
    'haute',
    false,
    false
  ),
  (
    'marche',
    'opportunite',
    'Levée de fonds 15M€ — startup RH Eurécia (Lyon)',
    'Eurécia, éditeur lyonnais de logiciel RH, annonce une levée de 15M€ pour accélérer sa croissance. Budget juridique en hausse prévisible, besoin en droit social (contrats CDI masse, conformité RGPD employés).',
    'https://www.maddyness.com/eurecia-15m-2025',
    'positif',
    'normale',
    false,
    false
  ),
  (
    'reputation',
    'mention',
    'Mention positive de DAIRIA Avocats sur LinkedIn',
    'Sofiane Coly mentionné dans un post LinkedIn de 500 partages par un DRH de Lyon : "Cabinet DAIRIA Avocats — intervention rapide et efficace dans notre PSE, je recommande". Sentiment très positif.',
    'https://www.linkedin.com/posts/drh-lyon-mention-dairia',
    'positif',
    'normale',
    false,
    false
  ),
  (
    'reputation',
    'avis',
    'Nouvel avis 5 étoiles Google My Business',
    'DAIRIA Avocats reçoit un avis 5 étoiles sur Google Maps : "Excellente expertise en droit social, réactivité remarquable, équipe très professionnelle. Je recommande vivement pour toute problématique RH." — Marie L., DRH PME.',
    null,
    'positif',
    'faible',
    true,
    false
  ),
  (
    'concurrentielle',
    'atmp',
    'WTW lance une offre AT/MP dédiée TPE/PME',
    'Willis Towers Watson annonce une offre simplifiée de gestion AT/MP ciblant les PME (10-200 salariés), avec un tarif d''entrée à 99€/mois. Concurrent direct de GererMesATMP sur le segment PME.',
    'https://www.willistowerswatson.com/fr/insights/atmp-pme-2025',
    'negatif',
    'haute',
    false,
    false
  ),
  (
    'marche',
    'opportunite',
    'Appel d''offres public — Accompagnement RH Région AURA',
    'La Région Auvergne-Rhône-Alpes publie un appel d''offres pour l''accompagnement juridique RH de ses 8000 agents (droit public/droit social). Montant estimé : 180k€/an. Date limite : 15/04/2026.',
    'https://www.marches-publics.gouv.fr/aura-ao-rh-2026',
    'positif',
    'haute',
    false,
    false
  ),
  (
    'reputation',
    'presse',
    'DAIRIA IA mentionné dans le classement Decideurs Magazine',
    'Le magazine Décideurs publie son classement annuel des legaltechs françaises. DAIRIA IA apparaît pour la première fois dans la catégorie "Innovation droit social", reconnu pour son approche IA + cabinet.',
    'https://www.decideurs-magazine.com/classement-legaltech-2026',
    'positif',
    'normale',
    true,
    false
  ),
  (
    'marche',
    'opportunite',
    'Nouvelle réglementation AT/MP — Décret du 12/03/2026',
    'Le décret n°2026-312 du 12 mars 2026 renforce les obligations de déclaration AT/MP pour les entreprises de plus de 50 salariés, avec nouvelles sanctions. Opportunité de conseil réglementaire et mise en conformité via GererMesATMP.',
    'https://www.legifrance.gouv.fr/decrets/2026-312',
    'positif',
    'haute',
    false,
    false
  )
on conflict do nothing;

-- Config de veille par défaut
insert into veille_config (mots_cles, sources, frequence, actif) values
  (
    ARRAY['DAIRIA Avocats', 'DAIRIA IA', 'GererMesATMP', 'Sofiane Coly', 'droit social Lyon', 'PSE Lyon', 'AT/MP réglementation'],
    ARRAY['Google Alerts', 'Legifrance', 'LinkedIn', 'Les Echos', 'Décideurs Magazine'],
    'quotidienne',
    true
  )
on conflict do nothing;
