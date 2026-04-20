# Subscription Reminders Edge Function

Cette fonction doit être appelée chaque jour (ex: 08:00 UTC) via **Supabase Cron**.

## Déploiement

```bash
supabase functions deploy subscription-reminders --no-verify-jwt
```

## Variables d'environnement

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (optionnel en local)
- `REMINDER_EMAIL_FROM` (optionnel)

## Exemple de cron (SQL)

```sql
select cron.schedule(
  'daily-subscription-reminders',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT-REF>.functions.supabase.co/subscription-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SUPABASE_ANON_OR_SERVICE_JWT>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```
