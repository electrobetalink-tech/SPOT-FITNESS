# GUIDE SuperAdmin — SPOT FITNESS

## 1) Accès au back-office

1. Connectez-vous via `/auth/login`.
2. Vérifiez que votre rôle en base est `superadmin`.
3. Après connexion, vous êtes redirigé vers `/admin/dashboard`.

## 2) Gestion des membres

- Créez un nouvel abonnement depuis `/admin/subscribers/new`.
- Modifiez un abonnement existant depuis `/admin/subscribers/[id]/edit`.
- Vérifiez le statut (`pending_payment`, `active`, `expired`, `blocked`).

## 3) Paiements

- Enregistrez les paiements cash depuis le module paiements.
- Téléchargez les reçus PDF si nécessaire.
- Exportez l'historique via l'API CSV d'administration.

## 4) Contrôle des accès

- Le middleware protège les routes privées.
- Les politiques RLS Supabase empêchent les accès non autorisés.
- Les membres ne voient que leurs propres données.

## 5) Exploitation production

- Vérifiez les logs d'erreurs sur Vercel après chaque déploiement.
- Surveillez les performances via Analytics Vercel.
- Exécutez les migrations SQL avant une mise en ligne majeure.

## 6) Checklist avant release

- [ ] `npm run ci:check` localement
- [ ] Variables d'environnement production complètes
- [ ] Migrations Supabase synchronisées
- [ ] Workflow GitHub Actions vert
- [ ] Déploiement Vercel réussi
