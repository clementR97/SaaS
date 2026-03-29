# Mettre le site en ligne pour un client

Ce guide décrit les étapes pour déployer l’application en production (site public + admin + réservations).

---

## 1. Vérifier le build en local

Avant de déployer, assure-toi que le build passe :

```bash
npm run build
npm run preview
```

Ouvre `http://localhost:4173` : le site doit s’afficher correctement et les réservations doivent fonctionner (connexion Supabase).

---

## 2. Variables d’environnement en production

L’app utilise **Supabase** via deux variables (préfixe `VITE_` pour être exposées au front) :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase (ex. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme (publique) du projet Supabase |

- **Ne jamais** commiter `.env` dans Git.
- En production, tu configureras ces variables dans l’interface de l’hébergeur (voir ci‑dessous).

---

## 3. Choisir un hébergeur pour le frontend

Le projet est une **SPA React** générée par Vite. Tu peux utiliser n’importe quel hébergeur de fichiers statiques ou plateforme front.

### Option A : Vercel (recommandé, gratuit pour petits projets)

1. Crée un compte sur [vercel.com](https://vercel.com).
2. Lie ton dépôt Git (GitHub / GitLab / Bitbucket).
3. **Build settings** :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`
4. **Environment Variables** (onglet Settings → Environment Variables) :
   - `VITE_SUPABASE_URL` = l’URL de ton projet Supabase
   - `VITE_SUPABASE_ANON_KEY` = la clé anon
5. Déploie. Chaque push sur la branche principale peut déclencher un nouveau déploiement.

**Important** : Pour que les routes React (ex. `/admin`, `/admin/dashboard`) fonctionnent en direct (refresh ou lien direct), ajoute un fichier `vercel.json` à la racine :

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Cela renvoie toutes les URLs vers `index.html` (comportement SPA).

### Option B : Netlify

1. Compte sur [netlify.com](https://netlify.com), connecte ton repo.
2. **Build command** : `npm run build`
3. **Publish directory** : `dist`
4. Variables d’environnement dans **Site settings → Environment variables** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
5. Fichier `public/_redirects` (à créer) pour le SPA :

```
/*    /index.html   200
```

### Option C : Hébergement classique (OVH, o2switch, etc.)

1. En local : `npm run build` → le dossier `dist/` contient le site.
2. Uploade le **contenu** de `dist/` (pas le dossier lui‑même) via FTP/SFTP à la racine du site (ou dans un sous-dossier).
3. Configure le serveur pour que toutes les requêtes vers des chemins “inconnus” renvoient `index.html` (réécriture vers `index.html`), sinon `/admin` et autres routes ne marcheront pas en accès direct.
4. Les variables d’environnement ne sont pas injectées côté serveur pour un build Vite : elles sont **compilées** au build. Il faut donc soit :
   - faire le build sur ta machine avec un `.env.production` contenant les bonnes valeurs, puis uploader `dist/`,  
   - soit utiliser un CI (GitHub Actions, etc.) qui fait le build avec les variables définies en secrets et déploie `dist/`.

---

## 4. Supabase en production

- Utilise un **projet Supabase dédié** pour le client (ou un projet “production” distinct de la dev).
- Dans le dashboard Supabase :
  - **Authentication** : si tu utilises l’auth pour l’admin, vérifie les “Redirect URLs” et ajoute l’URL de production (ex. `https://monsite.com`, `https://monsite.com/admin`).
  - **Database** : les policies et les migrations déjà appliquées en dev doivent être appliquées sur ce projet (scripts SQL idempotents, migrations, etc.).
  - **Edge Functions** (ex. sync Google Calendar) : déploie-les sur ce projet et configure les secrets (clés Google, etc.) dans Supabase.

### Ordre des scripts SQL (base de données)

Sur un **nouveau** projet Supabase, l’ordre correct est :

1. **Schéma de base** — équivalent de ton fichier `karuzen-schema` : dans ce repo, `supabase-schema.sql` (table `bookings`, RLS anon insert, ancienne `get_booked_slots()` sans paramètre).
2. **Schéma admin + quota** — équivalent de ton `admin-karuzen` : dans ce repo, `supabase-admin-schema.sql` (colonnes `statut_paiement`, `email`, `activity_type`, table `site_config`, RPC `get_booked_slots(text, int)`, `get_slot_counts`, policies authentifié sur `bookings`).
3. **Migrations incrémentales** — dossier `supabase/migrations/` (dans l’ordre des dates de fichier), ou `supabase db push` si tu utilises le CLI lié au projet.  
   - Les fichiers `20250301…`, `20250302…`, `20250303…` recouvrent en partie ce qui est déjà dans `supabase-admin-schema.sql` : **ne pas tout réappliquer en double** sur une base déjà initialisée avec l’étape 2.
4. **Demandes de rappel (nouveaux clients)** — `supabase/migrations/20250304000000_callback_requests.sql` (table `callback_requests`).

**En pratique :**

- **Projet vide** : exécuter dans le **SQL Editor** Supabase, dans cet ordre : `supabase-schema.sql` → `supabase-admin-schema.sql` → puis le contenu de `20250304000000_callback_requests.sql` (ou appliquer uniquement les migrations via `supabase db push` si tu as initialisé le dossier `supabase/` sans passer par les deux premiers fichiers à la main — dans ce cas, assure-toi qu’une migration initiale crée bien `bookings` + RLS de base).
- **Projet déjà en prod** : n’exécuter que ce qui manque (ex. uniquement `callback_requests` si le reste est déjà là). Les scripts utilisent en général `if not exists` / `drop policy if exists` pour limiter les erreurs, mais refaire tout le bloc `site_config` + inserts peut être inutile.

---

## 5. Nom de domaine (optionnel)

- Chez Vercel / Netlify : tu peux ajouter un domaine personnalisé (ex. `www.harmonie-vitalite.fr`) dans les paramètres du projet.
- Pointe le DNS du domaine vers l’hébergeur (CNAME ou A selon les instructions).
- Pense à déclarer l’URL finale dans Supabase (Auth → URL de redirection) et dans Google Cloud si tu utilises la sync Calendar.

---

## 6. Checklist avant livraison client

- [ ] Build sans erreur : `npm run build`
- [ ] Variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` configurées en production
- [ ] Supabase : projet production, policies et auth (redirect URLs) configurés
- [ ] Routes SPA : rewrite vers `index.html` (ou `_redirects` / `vercel.json`) pour `/admin` et sous-routes
- [ ] Test réservation complète (formulaire → enregistrement en base)
- [ ] Test accès admin (connexion → dashboard → config)
- [ ] (Si utilisé) Sync Google Calendar testée avec un RDV de test
- [ ] Contenu client : textes, images, coordonnées (footer, contact) à jour
- [ ] SSL activé (HTTPS) — inclus par défaut sur Vercel/Netlify

---

## Résumé rapide (Vercel)

1. Push le code sur GitHub (sans `.env`).
2. Sur Vercel : New Project → import repo → Framework Vite, build `npm run build`, output `dist`.
3. Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans Environment Variables.
4. Ajouter `vercel.json` avec la règle `rewrites` vers `/index.html`.
5. Deploy. Ton site est en ligne ; tu peux ensuite ajouter un domaine personnalisé si besoin.
