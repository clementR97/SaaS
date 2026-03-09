# Avis Google (témoignages) sur le site

La section « Témoignages » peut afficher les **avis Google** de votre établissement (Google Business Profile / fiche Google Maps) au lieu de témoignages statiques.

## Fonctionnement

- Une **Edge Function** Supabase (`get-google-reviews`) appelle l’**API Google Places** pour récupérer les avis du lieu.
- Le frontend appelle cette fonction au chargement de la page et affiche les avis (nom, texte, étoiles).
- Si la config est absente ou si l’API échoue, les **témoignages de secours** (définis dans le code) s’affichent.

## Configuration

### 1. Google Cloud : activer l’API et créer une clé

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. Crée un projet ou sélectionne celui qui héberge déjà ton app (ex. même projet que pour Google Calendar).
3. **APIs & Services → Enable APIs and Services** : recherche **Places API (New)** et active-la.
4. **APIs & Services → Credentials** : crée une **API Key** (ou réutilise une clé existante). Pour limiter l’usage, tu peux restreindre la clé à « Places API (New) » uniquement.

### 2. Récupérer le Place ID

Le **Place ID** identifie ta fiche établissement sur Google (Maps / Business Profile).

- Va sur [Google Maps](https://www.google.com/maps), cherche ton établissement par nom et adresse.
- Ouvre la fiche du lieu, clique sur **Partager** puis **Intégrer une carte** : l’URL contient un paramètre du type `!1s0x...` ou un identifiant.  
  **Ou** utilise un outil comme [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id) : entre l’adresse ou le nom, récupère le **Place ID** (ex. `ChIJ...`).

### 3. Secrets Supabase (Edge Function)

Dans le dashboard Supabase : **Project Settings → Edge Functions → Secrets** (ou **Settings → Vault** selon l’interface), ajoute :

| Secret                    | Description                                      |
|---------------------------|--------------------------------------------------|
| `GOOGLE_PLACES_API_KEY`   | La clé API Google (Places API (New))           |
| `GOOGLE_PLACE_ID`         | Le Place ID de ton établissement (ex. `ChIJ...`) |

Puis **redéploie** la fonction `get-google-reviews` pour que les secrets soient pris en compte.

### 4. Déployer la fonction

En local (avec l’CLI Supabase) :

```bash
supabase functions deploy get-google-reviews
```

Les variables d’environnement / secrets configurés dans le projet sont automatiquement disponibles pour la fonction.

## Limites Google

- L’API Places (New) renvoie **au plus 5 avis** par requête pour un lieu.
- Les avis sont ceux visibles sur la fiche Google du lieu (Google Business Profile).
- La tarification dépend de ton quota Google Cloud (voir la [doc Places API](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)).

## Résumé

1. Activer **Places API (New)** et créer une **API Key** dans Google Cloud.
2. Récupérer le **Place ID** de l’établissement (Maps ou Place ID Finder).
3. Ajouter les secrets **GOOGLE_PLACES_API_KEY** et **GOOGLE_PLACE_ID** dans Supabase.
4. Déployer `get-google-reviews`.

Une fois configuré, la section Témoignages affichera les avis Google ; sinon les témoignages de secours restent affichés.
