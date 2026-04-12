# Manuel — Trouver l’ID d’un calendrier Google (Calendar ID)

**KaruZen / synchronisation Supabase — Google Calendar**

Ce document explique comment récupérer l’**identifiant unique** d’un agenda Google (souvent appelé **Calendar ID**). Cet ID est nécessaire pour configurer la variable **`CALENDAR_ID`** dans Supabase (Edge Function de synchronisation).

---

## 1. À quoi sert le Calendar ID ?

- Chaque agenda Google (principal, professionnel, « RDV site », etc.) possède un **ID fixe**.
- Les applications (comme une Edge Function) utilisent cet ID pour **savoir dans quel agenda** créer ou modifier les événements.
- Ce n’est **pas** un mot de passe : c’est un identifiant technique, souvent **visible** dans les paramètres du calendrier.

---

## 2. Avant de commencer

- Connecte-toi avec le **compte Google qui possède** l’agenda concerné (souvent le compte du professionnel / du client).
- Ouvre un navigateur et va sur : **https://calendar.google.com**

---

## 3. Méthode recommandée : Paramètres du calendrier

### Étape 1 — Ouvrir la liste des agendas

1. Sur la **gauche** de l’écran, sous le mois, tu vois la liste **« Mes agendas »** (ou **My calendars**).
2. Repère l’agenda dont tu veux l’ID (ex. ton nom, ou un agenda secondaire « Rendez-vous »).

### Étape 2 — Menu des paramètres

1. **Survole** le nom de l’agenda avec la souris.
2. Clique sur les **trois points ⋮** à droite du nom (menu **Options**).
3. Choisis **« Paramètres et partage »**  
   (en anglais : **Settings and sharing**).

### Étape 3 — Lire le Calendar ID

1. La page des paramètres s’ouvre. Fais défiler jusqu’à la section **« Intégrer le calendrier »**  
   (en anglais : **Integrate calendar**).
2. Tu y trouves le champ **« ID du calendrier »**  
   (en anglais : **Calendar ID**).
3. **Sélectionne tout le texte** dans ce champ et **copie-le** (Ctrl+C / Cmd+C).

**Exemples de forme d’ID :**

| Type d’agenda        | Exemple d’ID                          |
|----------------------|----------------------------------------|
| Agenda principal     | Souvent ton **adresse e-mail Gmail** (ex. `prenom.nom@gmail.com`) |
| Parfois (rare)       | Le mot **`primary`** (uniquement si la doc / l’outil le demande explicitement) |
| Agenda secondaire    | Souvent une chaîne du type `xxxx@group.calendar.google.com` |

4. Colle cette valeur dans ton fichier de configuration (ex. secret Supabase **`CALENDAR_ID`**) **sans espace** avant ou après.

---

## 4. Cas particulier : agenda « principal »

- Pour l’agenda **principal** du compte, l’ID est très souvent **l’adresse e-mail complète** du compte Google (celle avec laquelle tu te connectes à Gmail / Agenda).
- Si la section « Intégrer le calendrier » affiche bien cette adresse comme **Calendar ID**, c’est la valeur à utiliser.

---

## 5. Vérification rapide

- L’ID ne contient en général **pas** d’espaces.
- Longueur typique : une **adresse e-mail** ou une chaîne **@group.calendar.google.com**.
- Si tu partages l’agenda avec un **compte de service** (fichier JSON Google Cloud), l’ID copié ici est bien celui du **même** agenda que tu as partagé.

---

## 6. Après avoir copié l’ID

1. Dans **Supabase** → **Edge Functions** → **Secrets**, définis **`CALENDAR_ID`** avec la valeur copiée.
2. Vérifie que le **compte de service** (e-mail se terminant par `@…iam.gserviceaccount.com`) a bien les droits sur **cet** agenda (**Modifier les événements**), comme décrit dans **`docs/GOOGLE_CALENDAR.md`**.

---

## 7. Problèmes fréquents

| Problème | Piste de solution |
|----------|-------------------|
| Je ne vois pas « Intégrer le calendrier » | Descends plus bas dans la même page **Paramètres et partage** ; le libellé peut varier légèrement selon la langue. |
| Plusieurs agendas | Répète les étapes pour **chaque** agenda : chaque calendrier a **son propre** Calendar ID. |
| Mauvais compte Google | Vérifie en haut à droite **quel compte** est connecté sur calendar.google.com. |
| Sync qui ne crée pas d’événements | L’ID peut être incorrect, ou le partage avec le compte de service manquant — revoir **`GOOGLE_CALENDAR.md`**. |

---

## 8. Documentation liée dans le projet

- Configuration complète (Google Cloud, compte de service, Supabase, webhooks) : **`docs/GOOGLE_CALENDAR.md`**
- Déploiement du site : **`docs/DEPLOIEMENT.md`**

---

*Document généré pour faciliter la configuration du Calendar ID — KaruZen Guadeloupe.*
