# DAIRIA Sales — Guidelines pour Claude

## Mode de travail
- Tu travailles en AUTONOMIE TOTALE. Ne pose JAMAIS de questions.
- Prends toutes les decisions techniques toi-meme en choisissant la solution la plus simple et standard.
- Code tout ce qui est demande, puis ouvre une PR quand c'est termine.
- Si un choix est ambigu, tranche et documente ton choix dans un commentaire de code ou le README.

## Deploiement (OBLIGATOIRE)
- Tous les projets sont deployes sur Render.
- Ton travail n'est PAS termine tant que le deploiement Render ne fonctionne pas.
- Si le build ou le deploiement echoue sur Render, tu analyses l'erreur et tu corriges immediatement.
- Tu iteres jusqu'a ce que ca tourne en production. Pas de PR "finie" si ca plante au deploy.
- Verifie les logs Render, les variables d'environnement, les ports, les health checks.

## Notification de livraison (OBLIGATOIRE)
Quand une tache est TERMINEE (code + tests + securite + deploy Render OK), tu DOIS poster un commentaire sur l'issue/PR avec ce format :

## ✅ Livraison terminee

**URL de production** : [lien Render]
**Identifiants** (si applicable) :
- Email admin : [email]
- Mot de passe : [mot de passe genere]

**Ce qui a ete fait** :
- [liste des fonctionnalites implementees]

**Tests** : ✅ [X] tests passes / [Y]% couverture
**Securite** : ✅ Audit OWASP passe
**Deploy** : ✅ En ligne sur Render

Si l'outil necessite des identifiants, genere un mot de passe fort et inclus-le dans le commentaire.
Sofiane (scoly-oss) recoit les notifications GitHub par email, donc ce commentaire lui sert de notification.

## Contexte
DAIRIA Sales est le CRM commercial intelligent du cabinet DAIRIA Avocats.
C'est un HubSpot-like dedie aux cabinets d'avocats : pipeline commercial, propositions, relances IA, dashboard revenue.

## Charte graphique DAIRIA (OBLIGATOIRE)
- Fond : #f8f8f6
- Blanc : #ffffff
- Navy (texte principal) : #1e2d3d
- Navy clair : #2a3f54
- Orange (accent, CTA) : #e8842c
- Orange clair : #f5a65c
- Gris (texte secondaire) : #6b7280
- Gris clair (bordures) : #e5e5e3
- Cards : fond blanc, border-radius 14px, ombre legere
- Boutons principaux : orange #e8842c, texte blanc
- Police : system-ui, -apple-system, sans-serif
- Design : professionnel, elegant, epure, adapte a un cabinet d'avocats

## Stack technique
- Framework : Next.js 16 + TypeScript strict
- UI : Tailwind CSS v4
- Base de donnees : Supabase (meme projet que les autres apps DAIRIA)
- Supabase URL : https://noqzwkkdfpbmglewsozo.supabase.co
- Auth : Supabase Auth
- Deploy : Render (web service Node.js)

## IMPORTANT Next.js 16
- NE PAS utiliser middleware.ts — utiliser proxy.ts avec export function proxy()
- NE PAS mettre eslint dans next.config.ts (deprecated)
- Ajouter "type": "module" dans package.json si erreurs ESM
- Exclure les fichiers de test du tsconfig
- Importer React explicitement si React.xxx est utilise

## Regles de code
- TypeScript strict
- Commits en francais, clairs et concis
- Ne jamais committer de secrets ou cles API
- Variables d'environnement dans .env.example

## Tests (OBLIGATOIRE)
- Chaque fichier de code doit avoir son fichier de test associe
- Tests unitaires pour chaque fonction/methode
- Viser un minimum de 80% de couverture de code
- Les tests doivent passer AVANT d'ouvrir une PR

## Audit securite (OBLIGATOIRE sur chaque dev)
- OWASP Top 10 : verifier chaque endpoint
- Injection SQL/NoSQL : parametrer toutes les requetes
- XSS : sanitizer toutes les entrees utilisateur
- Authentification : verifier les tokens, expiration
- Secrets : aucun secret en dur, tout en variables d'environnement
- RGPD : consentement, droit a l'oubli, minimisation des donnees
