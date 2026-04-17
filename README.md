# SPOT FITNESS

Application de gestion de salle de sport construite avec **Next.js 14**, **Supabase** et **Tailwind CSS**.

## Fonctionnalités clés

- Authentification et rôles (`superadmin`, `member`)
- Gestion des abonnements et paiements en espèces
- Génération de reçus et historique des transactions
- Contrôle d'accès via Row Level Security (Supabase)
- SEO de base prêt pour la production (metadata, sitemap, robots)
- Pipeline CI/CD GitHub Actions + Vercel

## Prérequis

- Node.js 20+
- npm 10+
- Projet Supabase configuré
- Compte Vercel (pour le déploiement)

## Installation locale

1. Cloner le dépôt
2. Installer les dépendances
3. Créer le fichier d'environnement

```bash
cp .env.example .env.local
npm ci
```

4. Renseigner les variables Supabase dans `.env.local`
5. Lancer l'application

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Qualité & tests

```bash
npm run lint
npm run typecheck
npm run ci:check
```

## Déploiement Vercel

Variables nécessaires (GitHub Secrets ou environnement local):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Commandes disponibles:

```bash
npm run vercel:pull
npm run vercel:build
npm run vercel:deploy
```

Le workflow `.github/workflows/ci-cd.yml` déclenche:

- validation automatique sur Pull Request
- déploiement automatique sur `main`

## Documentation complémentaire

- `GUIDE.md` : mode opératoire SuperAdmin
- `docs/SETUP_PHASE_1.md` : étapes de setup initial
- `supabase/migrations/99999999999999_final_production_schema.sql` : script SQL consolidé
