# Synchronisation Google Agenda (Calendar)

Les réservations (insertions et modifications de date/heure) sont synchronisées avec un calendrier Google. Chaque RDV crée ou met à jour un événement dans l’agenda.

## Fonctionnement

1. **Insertion** : un client prend rendez-vous → la base enregistre la réservation → un **webhook** Supabase appelle l’Edge Function → création d’un événement Google Calendar → l’ID de l’événement est enregistré dans `bookings.google_event_id`.
2. **Modification** : l’admin modifie la date ou l’heure d’un RDV → webhook sur UPDATE → l’Edge Function met à jour l’événement correspondant dans Google (ou le crée si `google_event_id` était vide).

La durée d’un événement est fixée à **60 minutes** dans l’Edge Function (vous pouvez l’adapter ou la rendre configurable).

---

## 1. Google Cloud

### 1.1 Projet et API

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un projet ou sélectionnez-en un.
3. **APIs & Services** → **Enable APIs and Services** → cherchez **Google Calendar API** → **Enable**.

### 1.2 Compte de service

1. **APIs & Services** → **Credentials** → **Create Credentials** → **Service account**.
2. Donnez un nom (ex. `supabase-calendar-sync`) → **Create and Continue** → **Done**.
3. Cliquez sur le compte créé → onglet **Keys** → **Add Key** → **Create new key** → **JSON** → téléchargez le fichier.
4. Ouvrez le JSON : vous avez besoin de `client_email` et `private_key`. Vous allez les mettre dans les secrets Supabase (voir plus bas).

### 1.3 Calendrier à utiliser

1. Allez sur [Google Calendar](https://calendar.google.com).
2. Soit vous utilisez votre agenda principal, soit créez un calendrier dédié (ex. « RDV site »).
3. **Paramètres** du calendrier → section **Access permissions** → **Share with specific people** → ajoutez l’**email du compte de service** (du type `xxx@yyy.iam.gserviceaccount.com`) avec le droit **« Make changes to events »** (modifier les événements).
4. Notez l’**ID du calendrier** : dans les paramètres du calendrier, section **Integrate calendar**, champ **Calendar ID** (souvent l’email du calendrier ou `primary` pour l’agenda principal).

---

## 2. Supabase

### 2.1 Colonne et migration

La colonne `google_event_id` doit exister sur `bookings`. Si vous n’utilisez pas les migrations Supabase, exécutez dans le **SQL Editor** :

```sql
alter table public.bookings add column if not exists google_event_id text;
```

(Si vous avez déjà exécuté `supabase-admin-schema.sql` après ajout de cette ligne, c’est déjà fait.)

### 2.2 Déploiement de l’Edge Function

À la racine du projet :

```bash
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase functions deploy sync-google-calendar
```

`VOTRE_PROJECT_REF` est l’identifiant du projet (dans l’URL du dashboard Supabase).

### 2.3 Secrets (variables d’environnement)

Dans le dashboard Supabase : **Project Settings** → **Edge Functions** → **Secrets** (ou **Settings** → **Edge Functions** → **Manage secrets**).

Ajoutez :

| Nom | Valeur |
|-----|--------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Contenu **complet** du fichier JSON du compte de service (une seule ligne, pas de retours à la ligne). Vous pouvez minifier le JSON. |
| `CALENDAR_ID` | ID du calendrier Google (ex. `primary` ou l’email du calendrier). |
| `WEBHOOK_SECRET` | (Optionnel) Une chaîne secrète de votre choix ; à renseigner aussi dans la config du webhook (voir ci‑dessous). |

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont en général déjà fournis par Supabase aux Edge Functions. Si ce n’est pas le cas, ajoutez-les aussi en secrets.

### 2.4 Database Webhooks

Pour que chaque insertion ou mise à jour de réservation déclenche la sync :

1. **Database** → **Webhooks** → **Create a new hook**.
2. **Table** : `bookings` (schéma `public`).
3. **Events** : cochez **Insert** et **Update**.
4. **Type** : HTTP Request.
5. **URL** :  
   `https://VOTRE_PROJECT_REF.supabase.co/functions/v1/sync-google-calendar`  
   (remplacez `VOTRE_PROJECT_REF`).
6. **HTTP Headers** (si vous avez défini `WEBHOOK_SECRET`) :  
   `x-webhook-secret` : la même valeur que le secret.
7. Enregistrez le webhook.

Après cela, chaque INSERT ou UPDATE sur `bookings` enverra le payload (record / old_record) à l’Edge Function, qui créera ou mettra à jour l’événement dans Google Agenda.

---

## 3. Vérification

- Créez une réservation depuis le formulaire du site : un événement doit apparaître dans le calendrier Google (titre = prestation + séance, description = client + tél.).
- Modifiez la date/heure d’un RDV depuis le dashboard admin : l’événement correspondant dans Google doit être mis à jour.

En cas d’erreur, consultez les **logs** de l’Edge Function dans Supabase (**Edge Functions** → `sync-google-calendar` → **Logs**).

---

## 4. Résumé des fichiers

- **Migration** : `supabase/migrations/20250301000000_add_google_event_id.sql` (colonne `google_event_id`).
- **Edge Function** : `supabase/functions/sync-google-calendar/index.ts` (création/mise à jour d’événements Google, mise à jour de `bookings.google_event_id`).
- **Documentation** : ce fichier.

Aucune modification du code front (BookingModal, AdminDashboard) n’est nécessaire : la sync est entièrement pilotée par les webhooks et l’Edge Function.
