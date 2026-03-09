# Google (Avis + Calendrier) : pas de mot de passe client

Ce document répond à une question fréquente : **faut-il utiliser le compte Google du client ou créer un compte à part ? Et est-ce que le client doit nous donner son mot de passe ?**

**Réponse courte : non.** Aucun mot de passe Google du client n’est nécessaire. Rien ne ressemble à une « connexion » sur son compte.

---

## Compte Google : perso ou pro ?

**Vous n’avez pas besoin d’un compte Google « pro » (Google Workspace).** Un **compte Google personnel** (Gmail) suffit pour tout faire :

- Créer un **projet Google Cloud**
- Activer les API (Places API, Google Calendar API)
- Créer une **clé API** (avis Google)
- Créer un **compte de service** et télécharger le JSON (Google Calendar)

Beaucoup de freelances et petites agences utilisent leur Gmail perso pour gérer les projets Google Cloud de leurs clients. Google Workspace (compte « entreprise » avec e-mail @votresociete.com) est utile pour la boîte mail et le travail en équipe, mais ce n’est **pas** une obligation technique pour les API.

---

## 1. Avis Google (témoignages sur le site)

### Ce dont on a besoin

- Une **clé API** Google (Places API) : elle est créée dans un **projet Google Cloud**.
- Le **Place ID** du lieu (commerce / professionnel) : c’est un identifiant **public** de la fiche sur Google Maps. On le trouve en cherchant l’établissement sur Google Maps, sans se connecter.

### Qui crée quoi ?

- **Option A – Vous (le prestataire)**  
  Vous avez un projet Google Cloud, vous activez Places API, vous créez une clé API. Pour chaque client, vous utilisez uniquement le **Place ID** de son établissement (donnée publique). Le client ne vous donne **aucun identifiant ni mot de passe**.

- **Option B – Le client**  
  Le client crée son propre projet Google Cloud et sa clé API, puis vous transmet la clé et le Place ID. Là encore : **pas de mot de passe**, juste une clé technique qu’il peut révoquer à tout moment.

Dans les deux cas, **personne ne demande le mot de passe Google du client**. Les avis sont des données accessibles via l’API avec une clé, pas en se connectant à son compte.

---

## 2. Google Calendar (synchronisation des RDV)

### Ce dont on a besoin

- Un **compte de service** (Service Account) Google : c’est un « robot », pas un compte personnel. On télécharge un fichier JSON (clé), on ne choisit **pas** de mot de passe.
- Le **calendrier** dans lequel écrire les RDV : il appartient au client (ou à vous pour les tests). Pour que le robot puisse y écrire, le client **partage** ce calendrier avec l’**adresse e-mail du compte de service** (du type `xxx@projet.iam.gserviceaccount.com`).

### Qui crée quoi ?

- **Option A – Vous (le prestataire)**  
  Vous créez un projet Google Cloud (ou un par client si vous préférez). Vous créez un **compte de service**, vous téléchargez le JSON. Vous configurez votre backend (ex. Supabase) avec ce JSON.  
  Ensuite, **le client** fait une seule chose dans son Google Calendar :  
  **Paramètres du calendrier → Partager avec des personnes → ajouter l’e-mail du compte de service → droit « Modifier les événements ».**  
  Aucun mot de passe n’est demandé : c’est comme partager un calendrier avec un collègue, sauf que c’est une adresse « robot ».

- **Option B – Le client**  
  Le client crée son projet Google Cloud, son compte de service, et vous envoie le fichier JSON (ou les infos nécessaires). Vous ne touchez jamais à son compte Google « personnel ». Il peut supprimer le compte de service ou révoquer la clé quand il veut.

Dans les deux cas, **le client ne vous donne jamais son mot de passe Gmail / Google**. Il ne « se connecte » nulle part pour vous. Il partage uniquement un calendrier avec une adresse technique, comme on partage un dossier Google Drive avec quelqu’un.

---

## 3. Comment le présenter à vos clients

Vous pouvez leur dire par exemple :

- **Avis Google**  
  « Pour afficher vos avis Google sur le site, j’utilise une clé technique (API). Soit je l’utilise depuis mon propre projet, soit vous en créez une dans votre espace Google Cloud et vous me la transmettez. Dans tous les cas, je n’ai jamais besoin de votre mot de passe Google. »

- **Google Calendar**  
  « Pour que les réservations du site apparaissent dans votre agenda Google, il faut que votre calendrier soit partagé avec une adresse technique (un “robot”). Vous ajoutez cette adresse dans les paramètres de partage de votre calendrier, avec le droit “Modifier les événements”, comme si vous partagiez avec un assistant. Je ne me connecte jamais à votre compte et vous ne me donnez jamais votre mot de passe. »

Cela évite toute impression de « piratage » ou d’accès à leur compte : on utilise soit des clés API, soit un partage de calendrier explicite, sans connexion avec leur identifiant/mot de passe.

---

## 4. Résumé

| Besoin              | Mot de passe client ? | Concrètement |
|---------------------|------------------------|--------------|
| **Avis Google**     | **Non**                | Clé API (vous ou client) + Place ID (public). |
| **Google Calendar** | **Non**                | Compte de service (vous ou client) + client partage son calendrier avec l’e-mail du robot. |

Vous pouvez utiliser **votre** projet et vos clés pour tous vos clients (en gardant un Place ID par client pour les avis, et un partage de calendrier par client pour l’agenda), ou laisser chaque client créer son projet et vous transmettre uniquement les clés / le partage. Dans les deux cas, **aucun mot de passe Google n’est demandé**.

**Rappel :** un compte Gmail personnel suffit pour créer le projet Google Cloud et gérer les API ; un compte Google Workspace (« pro ») n’est pas requis.
