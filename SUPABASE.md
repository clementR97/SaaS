# Configuration Supabase pour les réservations

## 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte si besoin.
2. **New project** : nom, mot de passe BDD, région.
3. Une fois le projet créé, allez dans **Settings → API** :
   - **Project URL** → à mettre dans `VITE_SUPABASE_URL`
   - **anon public** (clé publique) → à mettre dans `VITE_SUPABASE_ANON_KEY`

## 2. Variables d’environnement

À la racine du projet :

```bash
cp .env.example .env
```

Éditez `.env` et remplacez par vos vraies valeurs :

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Redémarrez le serveur de dev après modification (`npm run dev`).

## 3. Créer la table des réservations

1. Dans le dashboard Supabase : **SQL Editor** → **New query**.
2. Copiez-collez le contenu du fichier **`supabase-schema.sql`**.
3. Cliquez sur **Run**.

La table `bookings` est créée avec les colonnes : prénom, nom, téléphone, date du RDV, heure, mode de paiement (Espèces / Carte bancaire), prestation, séance. Les données sont stockées **provisoirement** ; vous pouvez les consulter dans **Table Editor**.

Le script crée aussi :
- une **contrainte d’unicité** sur (date_rdv, heure_rdv) : un seul rendez-vous par créneau ;
- la fonction **`get_booked_slots()`** : le site l’utilise pour afficher les créneaux déjà réservés (grisés) sans exposer les données personnelles.

## 4. Nettoyage des rendez-vous passés

Pour ne garder que les rendez-vous à venir, vous pouvez supprimer les lignes dont la date est passée :

Dans **SQL Editor** :

```sql
delete from public.bookings where date_rdv < current_date;
```

Vous pouvez l’exécuter à la main de temps en temps, ou automatiser via une **Edge Function** + **Cron** dans Supabase.

## 5. Créneaux déjà réservés (grisés)

Quand un visiteur réserve un créneau, celui-ci est **grisé** pour les autres (bouton désactivé + libellé « (réservé) »). Les créneaux occupés sont chargés via la fonction `get_booked_slots()` (sans afficher noms ni téléphones). Si vous aviez déjà exécuté `supabase-schema.sql` avant cette évolution, ré-exécutez le fichier pour ajouter la fonction et la contrainte d’unicité.
