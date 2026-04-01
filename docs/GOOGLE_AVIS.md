# Avis Google (témoignages) sur le site

La section « Témoignages » peut afficher les **avis Google** de votre établissement (Google Business Profile / fiche Google Maps) au lieu de témoignages statiques.

## Fonctionnement

- Une **Edge Function** Supabase (`get-google-reviews`) appelle l’**API Google Places** pour récupérer les avis du lieu.
- Le frontend appelle cette fonction via le client Supabase (`supabase.functions.invoke`) et affiche les avis (nom, texte, étoiles).
- Si la config est absente ou si l’API échoue, les **témoignages de secours** (définis dans le code) s’affichent.

**Important** : l’API Places et les secrets restent **côté Supabase** (Edge Function). L’hébergeur du site (Vercel, Netlify, etc.) ne voit pas la clé Google : seules les variables `VITE_*` du frontend sont à configurer chez l’hébergeur.

---

## Configuration

### 1. Google Cloud : activer l’API et créer une clé

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. Crée un projet ou sélectionne celui qui héberge déjà ton app (ex. même projet que pour Google Calendar).
3. **Facturation** : pour **Places API (New)** (Maps Platform), Google demande en général un **compte de facturation** (coordonnées + moyen de paiement), même si ton usage reste souvent dans le **crédit mensuel** inclus (voir [tarification Places](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)). Sans cette étape, l’activation de l’API peut rester bloquée.
4. **APIs & Services → Enable APIs and Services** : recherche **Places API (New)** et active-la.
5. **APIs & Services → Credentials** : crée une **API Key** (ou réutilise une clé existante). Tu peux restreindre la clé à **Places API (New)** uniquement pour limiter l’usage.

**Alternative sans API** : si tu ne veux pas activer la facturation Google, ne configure pas les secrets Supabase ci‑dessous et laisse **`VITE_ENABLE_GOOGLE_REVIEWS`** absent ou à `false` : les témoignages statiques s’affichent ; tu peux ajouter un lien « Voir nos avis sur Google » vers ta fiche Maps.

### 2. Récupérer le Place ID

Le **Place ID** identifie ta fiche établissement sur Google (Maps / Business Profile).

- Va sur [Google Maps](https://www.google.com/maps), cherche ton établissement par nom et adresse.
- Ouvre la fiche du lieu, clique sur **Partager** puis **Intégrer une carte** : l’URL peut contenir un identifiant utile.  
  **Ou** utilise un outil comme [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id) : entre l’adresse ou le nom, récupère le **Place ID** (ex. `ChIJ...`).

### 3. Secrets Supabase (Edge Function)

Dans le dashboard Supabase : **Project Settings → Edge Functions → Secrets** (ou **Settings → Vault** selon l’interface), ajoute :

| Secret                    | Description                                      |
|---------------------------|--------------------------------------------------|
| `GOOGLE_PLACES_API_KEY`   | La clé API Google (Places API (New))           |
| `GOOGLE_PLACE_ID`         | Le Place ID de ton établissement (ex. `ChIJ...`) |

Puis **redéploie** la fonction `get-google-reviews` pour que les secrets soient pris en compte.

### 4. Déployer la fonction (Supabase)

En local (avec la [CLI Supabase](https://supabase.com/docs/guides/cli)) :

```bash
supabase functions deploy get-google-reviews
```

Les secrets configurés dans le projet sont disponibles pour la fonction au runtime.

---

## Mettre en ligne (production)

Le guide général du dépôt (**build**, SPA, routes `/admin`) est dans [`docs/DEPLOIEMENT.md`](./DEPLOIEMENT.md). Pour les avis Google, complète comme suit.

### Variables côté hébergeur (Vercel, Netlify, Cloudflare Pages, etc.)

Le frontend est une **SPA Vite** : les variables `VITE_*` sont **injectées au moment du build**. Configure-les dans l’interface de ton hébergeur (même endroit que pour Supabase), pour l’environnement **Production** :

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | Oui | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Oui | Clé anonyme publique |
| `VITE_ENABLE_GOOGLE_REVIEWS` | Pour activer les avis | Mets **`true`** uniquement quand Places API + secrets + fonction sont prêts. Sinon omets-la ou mets `false` : les témoignages de secours s’affichent. |

Après tout changement de variable, **relance un déploiement** (nouveau build) pour que les valeurs soient prises en compte.

### Vercel

1. Projet lié au dépôt Git, **Build Command** `npm run build`, **Output** `dist` (voir [`DEPLOIEMENT.md`](./DEPLOIEMENT.md) pour `vercel.json` / réécriture SPA).
2. **Settings → Environment Variables** : ajoute les trois variables ci‑dessus pour **Production** (et Preview si tu veux tester les avis sur les previews).
3. Déploie. Les appels aux avis passent par **Supabase** (`functions.invoke`), pas par les serveurs Vercel.

### Netlify, Cloudflare Pages, autre

Même principe : **build** = `npm run build`, dossier de publication = **`dist`**, variables d’environnement identiques. Pour la réécriture SPA, voir les exemples dans [`DEPLOIEMENT.md`](./DEPLOIEMENT.md) (`_redirects`, etc.).

### Rappel

- **Edge Functions** et **secrets Google** : uniquement dans le **dashboard Supabase** + déploiement CLI de la fonction.
- **Hébergeur** : uniquement le build statique + `VITE_*` (pas de clé Google dans Vercel/Netlify).

---

## Limites Google

- L’API Places (New) renvoie **au plus 5 avis** par requête pour un lieu.
- Les avis sont ceux visibles sur la fiche Google du lieu (Google Business Profile).
- La tarification dépend de ton quota Google Cloud (voir la [doc Places API](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)).

---

## Résumé

1. Activer **Places API (New)** et créer une **API Key** dans Google Cloud (compte de facturation souvent requis).
2. Récupérer le **Place ID** de l’établissement (Maps ou Place ID Finder).
3. Ajouter les secrets **GOOGLE_PLACES_API_KEY** et **GOOGLE_PLACE_ID** dans Supabase et déployer **`get-google-reviews`**.
4. Sur **Vercel / Netlify / autre** : définir **`VITE_ENABLE_GOOGLE_REVIEWS=true`** (+ variables Supabase habituelles) et redéployer.

Une fois configuré, la section Témoignages affichera les avis Google ; sinon les témoignages de secours restent affichés.
