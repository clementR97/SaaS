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
  - **Edge Functions** (ex. sync Google Calendar) : déploie-les sur ce projet et configure les secrets (clés Google, etc.) dans Supabase. **Guide pas à pas** (Google Cloud ↔ Google Agenda ↔ Supabase ↔ Vercel) : [`docs/GOOGLE_CALENDAR.md`](./GOOGLE_CALENDAR.md).

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

## 6. Migration depuis le compte prestataire

Tu as prototypé ou hébergé le projet sur **ton** compte Supabase et/ou **ton** projet Google Cloud : pour **livrer au client**, il faut que la **donnée** et la **facturation** reposent sur **ses** comptes (ou une organisation dont il est propriétaire). On ne « transfère » pas toujours un projet d’un compte personnel à l’autre : la méthode fiable est de **recréer** l’environnement chez le client puis de **basculer** le site et les secrets.

### 6.1 Principes

| Ressource | Objectif |
|-----------|----------|
| **Supabase** | Nouveau projet sur le compte du client (ou orga client) ; schéma + données migrées ; nouvelles clés `VITE_*` sur Vercel. |
| **Google Cloud** (Calendar, Places, etc.) | Nouveau projet (ou compte client) ; nouveaux comptes de service / clés API ; secrets mis à jour dans **Supabase**. |
| **Vercel / Netlify** | Variables d’environnement pointant vers le **nouveau** Supabase ; transfert du projet au client ou nouveau déploiement sous son compte. |

Le client peut te **inviter** (rôle dev) sur son Supabase et son Google Cloud pour que tu configures sans qu’il te donne ses mots de passe.

### 6.2 Supabase : quitter le compte prestataire

1. Le client crée un **projet Supabase** (ou t’invite sur son organisation).
2. **Recréer le schéma** : appliquer les mêmes scripts que pour une prod neuve (voir [§4](#4-supabase-en-production) et l’ordre SQL / migrations).
3. **Migrer les données** si la prod contient déjà des réservations, de la config (`site_config`), etc. : export depuis l’ancien projet (SQL, CSV, ou outils) puis import dans le nouveau — adapter au cas par cas.
4. **Edge Functions** : `supabase link` vers le **nouveau** `project-ref`, puis `supabase functions deploy` pour chaque fonction utilisée.
5. **Secrets** (Edge Functions) : recopier ou régénérer dans le nouveau projet (`GOOGLE_SERVICE_ACCOUNT_JSON`, `CALENDAR_ID`, `GOOGLE_PLACES_API_KEY`, etc. — voir [`GOOGLE_CALENDAR.md`](./GOOGLE_CALENDAR.md), [`GOOGLE_AVIS.md`](./GOOGLE_AVIS.md)).
6. **Webhooks** (ex. table `bookings` → `sync-google-calendar`) : recréer avec l’URL `https://NOUVEAU_REF.supabase.co/functions/v1/...`.
7. **Authentication** : ajouter les **Redirect URLs** de prod sur le nouveau projet ; recréer ou réinviter le compte admin.
8. **Vercel** : mettre `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` du **nouveau** projet → **redéployer**.
9. Après validation : **pause ou suppression** de l’ancien projet sur ton compte pour éviter double facturation et confusion.

### 6.3 Google Cloud / Google Agenda

1. **Nouveau projet** Google Cloud sur le compte du client (facturation selon sa politique).
2. Réactiver les APIs utilisées (**Calendar API**, **Places API (New)** si besoin), créer les **comptes de service** / clés **API** comme lors de la première install.
3. Mettre à jour les **secrets Supabase** avec les **nouveaux** JSON / clés (l’ancien compte de service ne sera plus utilisé).
4. **Google Calendar** : le client ouvre son agenda et **partage** le calendrier avec le **nouvel** e-mail de compte de service (`…@….iam.gserviceaccount.com`). Vérifier le `CALENDAR_ID` si l’agenda change.
5. Désactiver ou supprimer les anciennes clés / comptes de service sur **ton** Google Cloud une fois la bascule testée.

### 6.4 Hébergement frontend (Vercel, etc.)

- **Transférer** le projet Vercel au team du client, ou que le client **recrée** un projet relié au même dépôt Git et recolle les variables.
- Vérifier le **domaine** : DNS pointant vers le bon déploiement après transfert.

### 6.5 Livraison progressive

Si le site reste un temps sur tes comptes pour aller vite : prévoir au contrat une **phase de migration** vers les comptes client (date ou forfait), pour que le client **possède** Supabase, Google et le domaine à terme.

---

## 7. Checklist avant livraison client

- [ ] Build sans erreur : `npm run build`
- [ ] Variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` configurées en production
- [ ] Supabase : projet production, policies et auth (redirect URLs) configurés
- [ ] Routes SPA : rewrite vers `index.html` (ou `_redirects` / `vercel.json`) pour `/admin` et sous-routes
- [ ] Test réservation complète (formulaire → enregistrement en base)
- [ ] Test accès admin (connexion → dashboard → config)
- [ ] (Si utilisé) Sync Google Calendar testée avec un RDV de test
- [ ] Contenu client : textes, images, coordonnées (footer, contact) à jour
- [ ] SSL activé (HTTPS) — inclus par défaut sur Vercel/Netlify
- [ ] (Si tu quittes ton compte prestataire) Migration §6 effectuée : Supabase + secrets + webhooks + Vercel pointent bien vers les ressources **du client**

---

## 8. Maintenance, dépannage et abonnement

La livraison du site n’inclut en général **pas** une assistance illimitée dans le temps. Proposer un **abonnement de maintenance** (ou un forfait annuel) clarifie ce que tu fais pour le client, à quel rythme, et ce qui est en sus.

### 8.1 Ce que tu peux inclure dans un abonnement

| Type d’intervention | Exemples |
|---------------------|----------|
| **Veille technique** | Vérifier que le déploiement Vercel, Supabase et les Edge Functions sont OK ; alertes sur quotas / erreurs. |
| **Petites corrections** | Bug d’affichage, lien cassé, texte dans le footer, réglage de variable d’environnement après changement de domaine. |
| **Dépendances** | Mises à jour mineures de sécurité (`npm audit`, correctifs Vite/React) dans la limite d’un temps prévu au contrat. |
| **Support utilisateur** | Aide à se reconnecter à l’admin, rappel de procédure (sans former au dev). |
| **Coordination avec les tiers** | Échanges avec le support du domaine, DNS, ou Supabase si le problème est côté infra (dans la limite du temps). |

### 8.2 Ce qui est souvent **hors** abonnement (ou en option)

- **Nouvelles fonctionnalités** (nouvelle page, nouveau flux, intégration supplémentaire).
- **Refonte** graphique ou refonte de contenu importante.
- **Migration** majeure (changement d’hébergeur, grosse migration de données) — plutôt **devis** ou forfait.
- **Formation** longue au code ou à l’administration système.

### 8.3 Conditions à fixer par écrit

- **Durée** : mensuel, annuel, tacite reconduction ou non.
- **Volume** : heures incluses par mois (ex. 1–2 h) ou « petites interventions » sans décompte strict.
- **Délai de réponse** : ex. 48 h ouvrées pour un incident bloquant (pas une garantie « 24/7 » sauf accord et tarif adaptés).
- **Canal** : e-mail, ticket, outil de suivi — pas le SMS en permanence sauf urgence contractuelle.
- **Accès** : le client t’invite en **lecteur** ou **développeur** sur Vercel / Supabase (selon besoin) ; pas de partage de mot de passe par message.
- **Facturation des extras** : taux horaire ou devis pour tout ce qui dépasse le forfait.

### 8.4 Abonnement vs « à la demande »

- **Abonnement** : revenu régulier pour le client, prévisibilité ; tu réserves un peu de disponibilité.
- **Interventions à la demande** : facturation à l’heure ou au ticket ; adapté si le client veut peu d’appels par an.

Les deux peuvent coexister : **abonnement léger** (surveillance + petit bug) + **devis** pour les évolutions.

### 8.5 Rappel

Ce cadre est **à adapter** à ton activité et à ta juridiction ; un **contrat ou devis** signé évite les malentendus sur « ce qui est inclus ». Ce document technique ne remplace pas un conseil juridique.

---

## 9. Client peu disponible : qui fait quoi (Supabase, Google Cloud, Agenda)

Situation fréquente : le client **ne veut pas** tout paramétrer, **ne veut pas** te donner ses identifiants, **n’a pas le temps** pour une visio. Voici une **répartition claire** des rôles et ce qui est techniquement obligatoire.

### 9.1 Ce qu’il faut comprendre (Google Calendar)

Pour la sync agenda, il faut **à la fois** :

1. Un **compte de service** (fichier JSON) créé dans **Google Cloud** → va dans les **secrets Supabase** (`GOOGLE_SERVICE_ACCOUNT_JSON`).
2. Un **Calendar ID** (quel calendrier cible).
3. Le calendrier **partagé** avec l’**e-mail du compte de service** (`…@….iam.gserviceaccount.com`), avec le droit de **modifier les événements**.

**Le seul identifiant « Calendar ID » ne suffit pas** : sans (1) et sans (3), la sync ne peut pas fonctionner.

### 9.2 Le client n’a **pas besoin** d’ouvrir Google Cloud Console

Tu peux **tout faire côté Google Cloud toi-même** si tu acceptes que le **projet Google Cloud** (et la facturation API associée) soit sur **ton** compte Google (prestataire) au début :

- Tu crées le projet, tu actives **Google Calendar API**, tu crées le **compte de service**, tu télécharges le JSON, tu le mets dans **Supabase** (secrets).
- Le client **ne voit jamais** la console Google Cloud.

**Inconvénient** : la « propriété » du projet GCP est chez toi jusqu’à une **migration** vers un projet chez le client (voir [§6](#6-migration-depuis-le-compte-prestataire)). À prévoir au **contrat** (délai, forfait de transfert).

**Alternative** : le client crée un compte Google **pro** ou t’invite une **seule fois** sur son projet GCP (sans visio : il clique sur le lien d’invitation reçu par e-mail). Ensuite tu configures tout seul. Il n’a pas besoin de « comprendre » la console.

### 9.3 Ce que le client ne peut **pas** éviter pour Google Agenda**

**Partager son calendrier** avec l’e-mail du robot : **seul** le propriétaire du calendrier (ou un admin Google Workspace) peut faire cette action dans **Google Agenda** (calendar.google.com). Personne d’autre ne peut le faire à sa place.

- Ce n’est **pas** une visio obligatoire : tu peux envoyer un **PDF** ou une **page courte** avec captures : *Paramètres du calendrier → Partager avec des personnes → coller l’e-mail* `xxx@xxx.iam.gserviceaccount.com` → droit *Modifier les événements*.
- Temps réel : **~5 minutes** une fois.

Si le client **refuse absolument** toute action dans son agenda : **désactive la sync Calendar** (pas de JSON dans les secrets, ou ne pas déployer le webhook) et le site fonctionne sans événements créés dans Google. C’est un **choix produit**, pas un contournement technique.

### 9.4 Supabase : séparation des responsabilités

| Approche | Rôle du client | Rôle du prestataire |
|----------|----------------|---------------------|
| **Idéal** | Compte Supabase **à lui** ; il t’**invite** avec ton e-mail (rôle Developer / Admin selon besoin). | Tu configures schéma, RLS, fonctions, secrets. **Tu n’as pas besoin de son mot de passe.** |
| **Phase 1** | Rien tout de suite si tu crées le projet sur ton compte. | Tu livres vite ; migration vers son compte plus tard ([§6](#6-migration-depuis-le-compte-prestataire)). |

**Ne pas** demander le mot de passe Supabase : l’**invitation** (team / projet) suffit.

### 9.5 « Il ne veut pas partager son mail »

Souvent il veut dire : **pas le mot de passe**, pas **tous** ses mails perso.

- **Invitation** Supabase / Google Cloud / Vercel : tu utilises **ton** e-mail pro en tant qu’invité ; le client garde son compte.
- **Google Cloud** sur **ton** compte : tu n’as pas besoin de son mail Google pour créer le robot ; tu as besoin que **son** calendrier Google accepte le **partage** avec l’e-mail du robot (ce n’est pas « donner son mail » au sens mot de passe, c’est une action dans Agenda).

### 9.6 Synthèse

1. **Supabase** : compte client + **invitation** à toi = propre et sans mot de passe partagé.  
2. **Google Cloud** : soit **toi** (projet prestataire + calendrier partagé avec le robot), soit **invitation** sur le projet du client.  
3. **Google Calendar** : **une** action côté client (partage) — documentable sans visio.  
4. **Contrat** : qui paie GCP, quand bascule vers les comptes **du client**.

### 9.7 Modèle « tout sous le compte de mon entreprise » + abonnement

Tu peux centraliser les services **au nom de ton entreprise** (compte Google Cloud pro, organisation Supabase, team Vercel, etc.) et facturer :

- **une fois** : création du site, mise en ligne, configuration ;
- **régulièrement** : **abonnement** (hébergement, maintenance, renouvellements domaine si tu le gères, partie des coûts infra répercutés ou forfait tout compris).

**Avantages** : le client n’a pas à créer cinq comptes ; tu maîtrises le déploiement ; l’abonnement finance ton temps et les coûts récurrents (Supabase, Vercel, Google Cloud selon usage).

**Points à traiter au contrat** :

- **Propriété des données** : les données des **utilisateurs finaux du client** (réservations, etc.) appartiennent au **client** ; les **comptes techniques** peuvent être à ton entreprise tant que la **restitution** (export, transfert) est prévue.
- **Fin de contrat** : transfert vers des comptes **au nom du client** (voir [§6](#6-migration-depuis-le-compte-prestataire)), ou remise d’exports + délai de bascule.
- **Transparence** : ce qui est inclus dans l’abonnement (cf. [§8](#8-maintenance-depannage-et-abonnement)) vs options payantes.
- **RGPD** : si tu es **sous-traitant**, préciser les traitements et la localisation (Supabase / région projet).

Ce modèle est **légitime** et courant ; il doit être **écrit** (devis + CGV ou contrat de prestation) pour éviter les ambiguïtés sur la propriété et la sortie du client.

---

## Résumé rapide (Vercel)

1. Push le code sur GitHub (sans `.env`).
2. Sur Vercel : New Project → import repo → Framework Vite, build `npm run build`, output `dist`.
3. Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans Environment Variables.
4. Ajouter `vercel.json` avec la règle `rewrites` vers `/index.html`.
5. Deploy. Ton site est en ligne ; tu peux ensuite ajouter un domaine personnalisé si besoin.
