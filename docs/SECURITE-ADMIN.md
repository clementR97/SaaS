# Sécurité et architecture – Admin et données

## Ce qui est bien en place

### 1. **Authentification**
- Connexion admin via **Supabase Auth** (`signInWithPassword`) : le mot de passe n’est jamais stocké côté client, il est envoyé à Supabase (HTTPS en production).
- **Clé anon** uniquement dans le frontend (pas de clé service_role), donc les droits réels viennent des **RLS** et du JWT après login.

### 2. **Protection des routes**
- La page **dashboard** vérifie la session au chargement et redirige vers `/admin` si aucune session.
- Même en accédant directement à `/admin/dashboard`, les **données** sont protégées par RLS : sans JWT valide, les requêtes Supabase ne renvoient rien pour `bookings` et `site_config` (écriture).

### 3. **RLS (Row Level Security)**

| Table / usage      | Qui                    | Droits                          |
|--------------------|------------------------|----------------------------------|
| **bookings**      | Anonyme (visiteur)     | **INSERT** uniquement (prise de RDV) |
| **bookings**      | Authentifié (admin)    | **SELECT** + **UPDATE**         |
| **site_config**   | Tous                   | **SELECT** (lecture config)     |
| **site_config**   | Authentifié            | **INSERT / UPDATE / DELETE**    |

- Les visiteurs **ne peuvent pas** lire ni modifier les réservations (pas de policy SELECT/UPDATE pour `anon` sur `bookings`).
- La fonction **`get_booked_slots()`** (créneaux pris) est en `SECURITY DEFINER` et ne retourne que `date_rdv` et `heure_rdv` → pas de fuite de données personnelles (nom, tél., etc.).

### 4. **Transfert et stockage**
- En production, tout doit passer en **HTTPS** (hébergeur / reverse proxy).
- Supabase gère le chiffrement au repos ; les variables sensibles sont dans `.env` (à ne pas commiter).

### 5. **Architecture**
- Un seul client Supabase (anon) : après login, le même client envoie le JWT → RLS applique les bons droits. Pas de mélange anon/service_role côté front.
- Config (prestations, emploi du temps) centralisée dans **site_config**, lue par le formulaire public et l’admin.
- Logique de créneaux partagée dans **`utils/bookingSlots.ts`** et réutilisée partout.

---

## Points d’attention et améliorations possibles

### 1. **Qui est “admin” ?**
Aujourd’hui, **tout utilisateur authentifié** (tout compte Supabase Auth) peut accéder au dashboard et modifier les réservations / la config.  
Si tu veux restreindre à certains comptes (ex. une liste d’emails ou d’IDs) :
- Créer une table `admin_users (user_id uuid primary key)` et une policy qui autorise SELECT/UPDATE sur `bookings` et `site_config` **uniquement** si `auth.uid()` est dans cette table.

### 2. **Déconnexion / expiration de session**
Si la session expire ou est révoquée, l’utilisateur peut rester sur le dashboard jusqu’à la prochaine action ou rechargement.  
On peut ajouter un **listener** `onAuthStateChange` pour rediriger vers `/admin` dès que la session est perdue (voir implémentation possible dans le code).

### 3. **Bonnes pratiques en production**
- Utiliser un **mot de passe fort** pour le(s) compte(s) admin dans Supabase (Authentication → Users).
- Servir l’app en **HTTPS** uniquement.
- Ne pas exposer la **service_role** key (réservée à un backend ou des scripts sécurisés si besoin plus tard).

---

## Résumé

- **Page admin et transfert de données** : protégés par Auth + RLS ; pas de clé sensible côté client ; pas de lecture/modification des réservations par les visiteurs.
- **Architecture** : claire (un client, RLS, config centralisée, utils partagés).  
Pour un usage avec un ou quelques admins de confiance, la base est **sécurisée et bien architecturée**. Les améliorations ci‑dessus permettent de durcir encore (restriction des admins, réaction à la déconnexion).
