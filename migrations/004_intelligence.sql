-- Migration 004: Module Intelligence Client
-- Tables: client_intelligence, opportunites_ia, actu_impacts, propositions_envoyees

-- 1. Profil client enrichi avec données IA
CREATE TABLE IF NOT EXISTS client_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organisation_nom TEXT NOT NULL,
  secteur TEXT,
  code_naf TEXT,
  idcc TEXT,
  idcc_libelle TEXT,
  effectif_tranche TEXT CHECK (effectif_tranche IN ('-11', '11-50', '50-250', '250+')),
  services_souscrits TEXT[] DEFAULT '{}',
  score_opportunite INTEGER DEFAULT 0 CHECK (score_opportunite >= 0 AND score_opportunite <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Actualités juridiques et leur impact sur les clients
CREATE TABLE IF NOT EXISTS actu_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('decret', 'jurisprudence', 'reforme', 'ccn', 'loi')),
  source_ref TEXT,
  titre TEXT NOT NULL,
  resume TEXT,
  clients_concernes_ids UUID[] DEFAULT '{}',
  services_concernes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Opportunités détectées par l'IA
CREATE TABLE IF NOT EXISTS opportunites_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_intelligence_id UUID REFERENCES client_intelligence(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  organisation_nom TEXT,
  type TEXT NOT NULL CHECK (type IN ('services_manquants', 'saisonnalite', 'actu_juridique')),
  source TEXT,
  titre TEXT NOT NULL,
  description TEXT,
  service_propose TEXT,
  ca_estime INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle', 'en_cours', 'gagnee', 'perdue', 'ignoree')),
  actu_id UUID REFERENCES actu_impacts(id) ON DELETE SET NULL,
  email_genere TEXT,
  proposition_generee TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Historique des propositions envoyées
CREATE TABLE IF NOT EXISTS propositions_envoyees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunite_id UUID REFERENCES opportunites_ia(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  canal TEXT DEFAULT 'email' CHECK (canal IN ('email', 'courrier', 'presentiel')),
  date_envoi TIMESTAMPTZ,
  date_ouverture TIMESTAMPTZ,
  resultat TEXT DEFAULT 'envoye' CHECK (resultat IN ('envoye', 'ouvert', 'accepte', 'refuse')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_ci_organisation ON client_intelligence(organisation_id);
CREATE INDEX IF NOT EXISTS idx_ci_score ON client_intelligence(score_opportunite DESC);
CREATE INDEX IF NOT EXISTS idx_ci_effectif ON client_intelligence(effectif_tranche);
CREATE INDEX IF NOT EXISTS idx_opp_statut ON opportunites_ia(statut);
CREATE INDEX IF NOT EXISTS idx_opp_client ON opportunites_ia(client_intelligence_id);
CREATE INDEX IF NOT EXISTS idx_opp_type ON opportunites_ia(type);
CREATE INDEX IF NOT EXISTS idx_actu_type ON actu_impacts(source_type);
CREATE INDEX IF NOT EXISTS idx_actu_created ON actu_impacts(created_at DESC);

-- RLS
ALTER TABLE client_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE actu_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunites_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE propositions_envoyees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ci_select" ON client_intelligence FOR SELECT TO authenticated USING (true);
CREATE POLICY "ci_insert" ON client_intelligence FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ci_update" ON client_intelligence FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ci_delete" ON client_intelligence FOR DELETE TO authenticated USING (true);

CREATE POLICY "actu_select" ON actu_impacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "actu_insert" ON actu_impacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "actu_update" ON actu_impacts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "opp_select" ON opportunites_ia FOR SELECT TO authenticated USING (true);
CREATE POLICY "opp_insert" ON opportunites_ia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "opp_update" ON opportunites_ia FOR UPDATE TO authenticated USING (true);
CREATE POLICY "opp_delete" ON opportunites_ia FOR DELETE TO authenticated USING (true);

CREATE POLICY "prop_select" ON propositions_envoyees FOR SELECT TO authenticated USING (true);
CREATE POLICY "prop_insert" ON propositions_envoyees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "prop_update" ON propositions_envoyees FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- SEED : données fictives réalistes
-- ============================================================

-- 10 clients fictifs
INSERT INTO client_intelligence (id, organisation_nom, secteur, code_naf, idcc, idcc_libelle, effectif_tranche, services_souscrits, score_opportunite) VALUES
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Transport Leblanc SA', 'transport', '4941A', '16', 'CCN Transports routiers', '50-250', ARRAY['contentieux', 'conseil'], 72),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'BTP Construction Martin', 'btp', '4120A', '1597', 'CCN Travaux publics', '50-250', ARRAY['contentieux', 'formation_managers'], 65),
  ('a1b2c3d4-0003-0000-0000-000000000003', 'Pharma Dubois & Associés', 'sante', '2120Z', '176', 'CCN Industries pharmaceutiques', '11-50', ARRAY['audit_rgpd', 'conseil'], 58),
  ('a1b2c3d4-0004-0000-0000-000000000004', 'Tech Innovations SAS', 'tech', '6201Z', '1486', 'CCN Bureaux d''études techniques', '11-50', ARRAY['conseil'], 81),
  ('a1b2c3d4-0005-0000-0000-000000000005', 'Clinique Moreau', 'sante', '8621Z', '29', 'CCN Hospitalisation privée', '250+', ARRAY['contentieux', 'formation_managers', 'bilan_social'], 45),
  ('a1b2c3d4-0006-0000-0000-000000000006', 'Commerce Dupont SARL', 'commerce', '4719B', '3305', 'CCN Commerce de détail non alimentaire', '-11', ARRAY['conseil'], 30),
  ('a1b2c3d4-0007-0000-0000-000000000007', 'Hôtel Fontaine', 'hotellerie', '5510Z', '87', 'CCN Hôtels cafés restaurants', '11-50', ARRAY['securisation_contrats', 'conseil'], 55),
  ('a1b2c3d4-0008-0000-0000-000000000008', 'Industrie Renard Frères', 'industrie', '2599B', '1365', 'CCN Métallurgie', '250+', ARRAY['contentieux', 'formation_managers', 'audit_rh', 'bilan_social'], 38),
  ('a1b2c3d4-0009-0000-0000-000000000009', 'Restauration Garnier', 'restauration', '5610A', '87', 'CCN Hôtels cafés restaurants', '-11', ARRAY['conseil'], 25),
  ('a1b2c3d4-0010-0000-0000-000000000010', 'Distribution Bernard SA', 'distribution', '4690Z', '573', 'CCN Commerce en gros', '50-250', ARRAY['contentieux', 'conseil', 'securisation_contrats'], 70)
ON CONFLICT (id) DO NOTHING;

-- 5 actus juridiques récentes
INSERT INTO actu_impacts (id, source_type, source_ref, titre, resume, clients_concernes_ids, services_concernes) VALUES
  (
    'b2c3d4e5-0001-0000-0000-000000000001',
    'decret',
    'Décret n°2026-123 du 15 mars 2026',
    'Décret sur les entretiens professionnels obligatoires',
    'Le décret renforce les obligations des employeurs de plus de 50 salariés concernant les entretiens professionnels bisannuels. Des sanctions financières (1 500€ par salarié) sont prévues en cas de non-respect.',
    ARRAY['a1b2c3d4-0001-0000-0000-000000000001'::UUID, 'a1b2c3d4-0002-0000-0000-000000000002'::UUID, 'a1b2c3d4-0005-0000-0000-000000000005'::UUID, 'a1b2c3d4-0008-0000-0000-000000000008'::UUID, 'a1b2c3d4-0010-0000-0000-000000000010'::UUID],
    ARRAY['entretiens_pro', 'formation_managers']
  ),
  (
    'b2c3d4e5-0002-0000-0000-000000000002',
    'jurisprudence',
    'Cass. soc. 12 février 2026, n°24-11.234',
    'Jurisprudence Cass. soc. : élargissement définition harcèlement moral',
    'La Cour de cassation étend la notion de harcèlement moral aux situations de management agressif systématique. Tout employeur ayant eu des conflits avec des salariés est exposé à un risque accru de requalification.',
    ARRAY['a1b2c3d4-0001-0000-0000-000000000001'::UUID, 'a1b2c3d4-0002-0000-0000-000000000002'::UUID, 'a1b2c3d4-0005-0000-0000-000000000005'::UUID],
    ARRAY['audit_rh', 'formation_managers', 'conseil_disciplinaire']
  ),
  (
    'b2c3d4e5-0003-0000-0000-000000000003',
    'ccn',
    'Avenant n°18 CCN Transports routiers du 1er mars 2026',
    'Modification CCN Transports routiers — revalorisation des grilles salariales',
    'L''avenant n°18 à la CCN Transports routiers revalorise les grilles de classification et de salaires. Les entreprises du secteur ont jusqu''au 1er juillet 2026 pour se mettre en conformité.',
    ARRAY['a1b2c3d4-0001-0000-0000-000000000001'::UUID],
    ARRAY['conseil', 'bilan_social', 'accompagnement_nao']
  ),
  (
    'b2c3d4e5-0004-0000-0000-000000000004',
    'loi',
    'Loi n°2026-45 du 20 janvier 2026 portant réforme des retraites',
    'Réforme des retraites 2026 — nouvelles obligations employeurs',
    'La réforme introduit un dispositif de retraite progressive obligatoire pour les entreprises de plus de 250 salariés, et crée de nouveaux droits à information des salariés sur leur retraite complémentaire.',
    ARRAY['a1b2c3d4-0005-0000-0000-000000000005'::UUID, 'a1b2c3d4-0008-0000-0000-000000000008'::UUID],
    ARRAY['information_collective', 'bilan_social', 'conseil']
  ),
  (
    'b2c3d4e5-0005-0000-0000-000000000005',
    'jurisprudence',
    'Cass. soc. 5 mars 2026, n°24-15.891',
    'Nouveau barème Macron — plancher indemnité licenciement sans cause',
    'Revirement de jurisprudence : la chambre sociale fixe un plancher d''application du barème Macron. Pour les licenciements sans cause réelle, l''indemnité minimale est désormais de 3 mois pour 1 an d''ancienneté.',
    ARRAY['a1b2c3d4-0001-0000-0000-000000000001'::UUID, 'a1b2c3d4-0002-0000-0000-000000000002'::UUID, 'a1b2c3d4-0008-0000-0000-000000000008'::UUID, 'a1b2c3d4-0010-0000-0000-000000000010'::UUID],
    ARRAY['contentieux', 'audit_rh', 'conseil_disciplinaire']
  )
ON CONFLICT (id) DO NOTHING;

-- 20 opportunités IA fictives
INSERT INTO opportunites_ia (client_intelligence_id, organisation_nom, type, source, titre, description, service_propose, ca_estime, statut, actu_id) VALUES
  -- Transport Leblanc
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Transport Leblanc SA', 'services_manquants', 'rule_contentieux_audit', 'Audit préventif RH — contentieux récurrents', 'Transport Leblanc SA a des dossiers contentieux actifs mais n''a jamais réalisé d''audit de ses pratiques RH. Un audit préventif permettrait de sécuriser les pratiques et réduire les risques futurs.', 'audit_rh', 3500, 'nouvelle', NULL),
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Transport Leblanc SA', 'actu_juridique', 'actu_ccn_transport', 'Mise en conformité CCN Transports routiers — avenant n°18', 'L''avenant n°18 à la CCN Transports routiers impose une révision des grilles salariales avant le 1er juillet 2026. Un accompagnement est indispensable pour éviter les rappels de salaires.', 'accompagnement_nao', 4500, 'nouvelle', 'b2c3d4e5-0003-0000-0000-000000000003'),
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Transport Leblanc SA', 'actu_juridique', 'actu_barem_macron', 'Analyse exposition barème Macron — licenciements en cours', 'Le revirement jurisprudentiel sur le barème Macron impacte directement les dossiers de licenciement en cours. Une analyse urgente s''impose pour ajuster la stratégie contentieuse.', 'conseil_disciplinaire', 2000, 'en_cours', 'b2c3d4e5-0005-0000-0000-000000000005'),
  -- BTP Construction Martin
  ('a1b2c3d4-0002-0000-0000-000000000002', 'BTP Construction Martin', 'services_manquants', 'rule_rgpd', 'Audit RGPD — données salariés et sous-traitants', 'BTP Construction Martin traite des données sensibles de ses salariés et sous-traitants sans avoir réalisé d''audit RGPD. Le risque de sanction CNIL est élevé (jusqu''à 4% du CA).', 'audit_rgpd', 4500, 'nouvelle', NULL),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'BTP Construction Martin', 'actu_juridique', 'actu_harcelement', 'Formation prévention harcèlement — jurisprudence Cass. soc.', 'Suite à l''arrêt Cass. soc. du 12 février 2026, les entreprises de BTP sont particulièrement exposées. Une formation des managers à la prévention du harcèlement moral est indispensable.', 'formation_managers', 3000, 'nouvelle', 'b2c3d4e5-0002-0000-0000-000000000002'),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'BTP Construction Martin', 'saisonnalite', 'seasonal_march', 'Entretiens professionnels obligatoires — Mars 2026', 'Avec 50+ salariés, BTP Construction Martin est soumise à l''obligation légale d''entretiens professionnels. Un accompagnement permettra d''éviter les sanctions du décret de mars 2026.', 'entretiens_pro', 2500, 'nouvelle', NULL),
  -- Pharma Dubois
  ('a1b2c3d4-0003-0000-0000-000000000003', 'Pharma Dubois & Associés', 'services_manquants', 'rule_50_formation', 'Formation managers obligatoire — seuil 11+ salariés', 'Avec 11 à 50 salariés dans le secteur pharmaceutique (fort turn-over), Pharma Dubois n''a pas encore mis en place de formation managers. Risque de conflits internes et coût élevé en cas de contentieux.', 'formation_managers', 3000, 'nouvelle', NULL),
  ('a1b2c3d4-0003-0000-0000-000000000003', 'Pharma Dubois & Associés', 'services_manquants', 'rule_securisation_contrats', 'Sécurisation des contrats — CDD nombreux dans le secteur', 'Le secteur pharmaceutique recourt massivement aux CDD et intérims. Pharma Dubois ne dispose pas de conseil en sécurisation des contrats atypiques, s''exposant à des requalifications coûteuses.', 'securisation_contrats', 2000, 'nouvelle', NULL),
  -- Tech Innovations
  ('a1b2c3d4-0004-0000-0000-000000000004', 'Tech Innovations SAS', 'services_manquants', 'rule_rgpd', 'Audit RGPD prioritaire — données clients et salariés', 'Secteur tech : Tech Innovations SAS traite des données sensibles sans couverture RGPD. La CNIL a renforcé ses contrôles sur le secteur tech en 2025. Un audit est urgent.', 'audit_rgpd', 4500, 'en_cours', NULL),
  ('a1b2c3d4-0004-0000-0000-000000000004', 'Tech Innovations SAS', 'services_manquants', 'rule_contentieux_audit', 'Audit préventif RH — structuration phase de croissance', 'Tech Innovations SAS grandit rapidement. L''absence d''audit RH sur les pratiques d''embauche et de rémunération expose à des risques de discrimination et d''inégalité salariale.', 'audit_rh', 3500, 'nouvelle', NULL),
  ('a1b2c3d4-0004-0000-0000-000000000004', 'Tech Innovations SAS', 'saisonnalite', 'seasonal_march', 'Entretiens professionnels — obligation légale', 'Tech Innovations SAS emploie des salariés qualifiés en forte demande. Des entretiens professionnels bien conduits limitent le turn-over et démontrent l''investissement dans les parcours.', 'entretiens_pro', 2500, 'gagnee', NULL),
  -- Clinique Moreau
  ('a1b2c3d4-0005-0000-0000-000000000005', 'Clinique Moreau', 'actu_juridique', 'actu_retraites', 'Retraite progressive obligatoire — 250+ salariés', 'La Clinique Moreau (250+ salariés) est directement impactée par la réforme des retraites 2026. Un dispositif de retraite progressive doit être mis en place avec une information collective obligatoire.', 'information_collective', 5000, 'nouvelle', 'b2c3d4e5-0004-0000-0000-000000000004'),
  ('a1b2c3d4-0005-0000-0000-000000000005', 'Clinique Moreau', 'actu_juridique', 'actu_harcelement', 'Prévention harcèlement moral — milieu médical', 'Le milieu médical est particulièrement exposé aux risques psychosociaux. La jurisprudence Cass. soc. de 2026 renforce l''obligation de prévention. Une formation urgente des cadres s''impose.', 'formation_managers', 3000, 'en_cours', 'b2c3d4e5-0002-0000-0000-000000000002'),
  -- Commerce Dupont
  ('a1b2c3d4-0006-0000-0000-000000000006', 'Commerce Dupont SARL', 'services_manquants', 'rule_securisation_contrats', 'Sécurisation des contrats de travail — commerce de détail', 'Commerce Dupont SARL emploie majoritairement des CDD saisonniers et temps partiels. L''absence de conseil en rédaction de contrats expose à des requalifications en CDI.', 'securisation_contrats', 1500, 'nouvelle', NULL),
  -- Hôtel Fontaine
  ('a1b2c3d4-0007-0000-0000-000000000007', 'Hôtel Fontaine', 'services_manquants', 'rule_rgpd', 'Audit RGPD — données clients hôteliers', 'Le secteur hôtelier collecte de nombreuses données personnelles (passeports, CB, préférences). Hôtel Fontaine n''a pas de politique RGPD formalisée — risque CNIL et perte de confiance client.', 'audit_rgpd', 3500, 'nouvelle', NULL),
  ('a1b2c3d4-0007-0000-0000-000000000007', 'Hôtel Fontaine', 'services_manquants', 'rule_contentieux_audit', 'Audit RH préventif — turnover HCR', 'Le secteur HCR affiche le plus fort taux de turnover (>100%). Hôtel Fontaine a des contentieux mais aucun audit RH préventif. Chaque licenciement coûte en moyenne 15k€.', 'audit_rh', 2500, 'ignoree', NULL),
  -- Industrie Renard
  ('a1b2c3d4-0008-0000-0000-000000000008', 'Industrie Renard Frères', 'actu_juridique', 'actu_retraites', 'Retraite progressive — obligation 250+ salariés', 'Industrie Renard Frères (250+ salariés) doit mettre en place le dispositif de retraite progressive de la loi 2026 avant le 31 décembre 2026. Un accompagnement juridique est indispensable.', 'information_collective', 5000, 'nouvelle', 'b2c3d4e5-0004-0000-0000-000000000004'),
  -- Distribution Bernard
  ('a1b2c3d4-0010-0000-0000-000000000010', 'Distribution Bernard SA', 'actu_juridique', 'actu_entretiens_pro', 'Entretiens professionnels obligatoires — décret mars 2026', 'Distribution Bernard SA (50-250 salariés) est impactée par le décret de mars 2026 sur les entretiens professionnels. Des sanctions financières sont prévues en cas de non-conformité.', 'entretiens_pro', 2500, 'nouvelle', 'b2c3d4e5-0001-0000-0000-000000000001'),
  ('a1b2c3d4-0010-0000-0000-000000000010', 'Distribution Bernard SA', 'actu_juridique', 'actu_barem_macron', 'Analyse barème Macron — dossiers licenciement en cours', 'Le revirement jurisprudentiel sur le barème Macron impacte les procédures en cours. Une révision stratégique urgente des dossiers de licenciement est recommandée.', 'contentieux', 2000, 'en_cours', 'b2c3d4e5-0005-0000-0000-000000000005'),
  ('a1b2c3d4-0010-0000-0000-000000000010', 'Distribution Bernard SA', 'services_manquants', 'rule_50_formation', 'Formation managers — 50+ salariés sans programme structuré', 'Distribution Bernard SA atteint le seuil des 50 salariés sans avoir mis en place de programme de formation managers. Risque de contentieux managériaux et perte de productivité.', 'formation_managers', 3000, 'nouvelle', NULL);
