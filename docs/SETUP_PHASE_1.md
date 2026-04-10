# SPOT FITNESS — Phase 1 (Initialisation + Base de données)

## 1) Initialiser le projet

```bash
npm install
npm run dev
```

Le projet utilise:
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Supabase (client SSR + client browser)

## 2) Créer le projet Supabase
1. Créer un nouveau projet sur Supabase.
2. Copier l'URL et la clé ANON dans `.env.local`.
3. Exécuter la migration SQL:
   - soit avec Supabase CLI
   - soit directement dans l'éditeur SQL de Supabase avec le fichier:
     `supabase/migrations/20260410184500_init_spot_fitness.sql`

## 3) Schéma et règles déjà couverts
- Tables: `users`, `subscriptions`, `attendances`, `promotions`, `payment_transactions`
- Enums: rôles, statuts abonnement, plans
- Contrainte métier “1 entrée par jour par abonné” via `unique(user_id, check_in_date)`
- Génération automatique de numéro de reçu via `generate_receipt_number()`
- Calcul montants (mensuel/semestriel/annuel + promo) via `calculate_subscription_amount()`
- RLS activé + policies self/superadmin

## 4) Protection des routes
Le middleware protège:
- `/dashboard`
- `/profile`

Un utilisateur non connecté est redirigé vers `/`.

## 5) Étape suivante (Phase 2)
- Auth Supabase complète (login/logout + role loading)
- CRUD abonnés côté SuperAdmin
- Validation paiement espèces + activation abonnement
- Génération QR code chiffré
- Scan caméra navigateur + check-in quotidien
- Génération reçu PDF
