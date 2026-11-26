# BookMyMovie

> Projet final — 420-514 Collecte et interprétation des données (Automne 2026), Cégep Marie-Victorin
> Service de collecte, traitement et stockage de données avec une API RESTful

BookMyMovie aide les gens à **trouver le bon film**. Le site permet de trier et filtrer des milliers de films, de voir les films à l'affiche au Canada, de recevoir des recommandations calculées par notre propre modèle, de garder ses films dans « Ma liste » et de consulter des statistiques sur le cinéma.

Les données viennent de l'API de **TMDB** (The Movie Database). Elles sont collectées automatiquement, stockées dans MongoDB, nettoyées et analysées avec Python (Bronze → Silver → Gold), puis exposées par une API REST NestJS sécurisée.

---

## Table des matières

1. [Fonctionnalités](#1-fonctionnalités)
2. [Public cible](#2-public-cible)
3. [Source des données](#3-source-des-données)
4. [Architecture](#4-architecture)
5. [Structure du dépôt](#5-structure-du-dépôt)
6. [Modèle de données MongoDB](#6-modèle-de-données-mongodb)
7. [Pipeline Bronze → Silver → Gold](#7-pipeline-bronze--silver--gold)
8. [Questions d'analyse](#8-questions-danalyse)
9. [Recommandations (apprentissage machine)](#9-recommandations-apprentissage-machine)
10. [Déclenchement automatique](#10-déclenchement-automatique)
11. [API REST](#11-api-rest)
12. [Sécurité](#12-sécurité)
13. [Application cliente](#13-application-cliente)
14. [Installation et configuration](#14-installation-et-configuration)
15. [Tests](#15-tests)
16. [Déploiement](#16-déploiement)
17. [Limites et biais](#17-limites-et-biais)
18. [Feuille de route](#18-feuille-de-route)
19. [Crédits et licence des données](#19-crédits-et-licence-des-données)

---

## 1. Fonctionnalités

### Côté utilisateur
- **Catalogue** trié et filtré : genre, année, note, durée, langue, avec pagination côté serveur.
- **Recherche** par titre.
- **À l'affiche** au Canada, **bientôt en salle** et **tendances du jour**, mis à jour chaque nuit.
- **Fiche d'un film** : résumé, affiche, réalisateur, acteurs, classement au Canada.
- **« Tu aimeras aussi »** : 10 recommandations calculées par notre modèle.
- **Ma liste** : ajouter ou retirer des films (compte requis).
- **Statistiques** : 3 indicateurs et 3 graphiques issus des données Gold.

### Côté administrateur
- Lancement manuel de la collecte et du traitement, avec suivi de la réussite ou de l'échec.
- Historique des exécutions du pipeline.
- Gestion des films (ajouter, corriger, supprimer), puis relance du traitement.
- 3 indicateurs et 3 graphiques de fonctionnement.

---

## 2. Public cible

| Public | Utilisation |
|---|---|
| Cinéphiles et grand public | Chercher un film, voir ce qui est à l'affiche, recevoir des recommandations, garder sa liste |
| Personnes curieuses du marché du cinéma (étudiants, petits producteurs) | Consulter la rentabilité par genre et par budget, les tendances par décennie |
| Administrateur | Surveiller la collecte, lancer le pipeline, gérer les films |

---

## 3. Source des données

| Élément | Détail |
|---|---|
| Fournisseur | [TMDB — The Movie Database](https://www.themoviedb.org/) |
| Documentation | https://developer.themoviedb.org/reference |
| Accès | API REST JSON, jeton (Read Access Token) dans l'en-tête `Authorization: Bearer` |
| Conditions | Gratuit pour un usage non commercial, avec attribution à TMDB |
| Limite | Environ 40 requêtes par seconde, pas de limite quotidienne |
| Temps réel ? | Non : collecte **périodique** (chaque nuit) |
| Volume visé | **150 000 films** dans Bronze (seuil de l'énoncé : 100 000) |
| Observation | **1 observation = 1 film**, identifié par son ID TMDB (unique) |

### Routes TMDB utilisées

| Route | Usage |
|---|---|
| Daily ID exports (`files.tmdb.org`) | Liste de tous les ID de films pour l'import initial |
| `GET /movie/{id}?append_to_response=credits,keywords,release_dates` | Détail complet d'un film en un seul appel |
| `GET /movie/changes` | Films modifiés dans les dernières 24 h |
| `GET /movie/now_playing?region=CA` | Films à l'affiche au Canada |
| `GET /movie/upcoming?region=CA` | Films à venir au Canada |
| `GET /trending/movie/day` | Tendances du jour |
| `GET /genre/movie/list` | Liste des genres |
| `GET /movie/{id}/recommendations` | Uniquement pour **valider** notre modèle (pas affiché) |

### Unicité et doublons
- `_id` de `movies_bronze` = ID TMDB → insertion en **upsert**, un film n'est jamais compté deux fois.
- Les listes quotidiennes (à l'affiche, bientôt, tendances) ne comptent pas dans le seuil : elles référencent des films déjà présents.

### Reprise
Un export `mongodump` de la couche Bronze est conservé pour reconstruire la base si TMDB devient indisponible.

---

## 4. Architecture

```
TMDB API
   │  import initial (une fois) + chaque nuit : changes, now_playing, upcoming, trending
   ▼
Collecte (NestJS, cron)  ──►  Bronze (MongoDB, JSON brut)
                                   │
                                   ▼
                          Pipeline Python (pandas, NumPy, scikit-learn)
                                   │
                                   ▼
                          Silver + Gold (MongoDB)
                          (films nettoyés, statistiques, recommandations)
                                   │
                                   ▼
                          API REST NestJS (/api/v1, JWT, rôles user/admin)
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
          Site utilisateur (React)          Tableau admin (React)
                                            bouton « Lancer » ──► pipeline
```

### Patrons de conception
- **Architecture en modules NestJS** : chaque domaine (films, listes, stats, auth…) a son module, son contrôleur, son service et ses DTO.
- **Injection de dépendances** (NestJS) pour les services et les accès MongoDB.
- **Repository / Service** : la logique métier est dans les services, les contrôleurs ne font que recevoir et répondre.
- **Guards** pour l'authentification et les rôles, **pipes** pour la validation, **filtres d'exception** pour les erreurs structurées.
- **Médaillon (Bronze / Silver / Gold)** pour le traitement des données.

---

## 5. Structure du dépôt

```
bookmymovie/
├── src/                          # Serveur NestJS + TypeScript
│   ├── main.ts                   # démarrage de l'application
│   ├── configure-app.ts          # préfixe /api, versionnement, validation, filtres
│   ├── configure-swagger.ts      # documentation OpenAPI
│   ├── app.module.ts             # configuration, connexion MongoDB, modules
│   ├── config/                   # configuration typée (database.config.ts)
│   ├── common/                   # filtre d'erreurs (intercepteurs et décorateurs à venir)
│   ├── health/                   # route d'état de l'API
│   ├── collect/                  # client TMDB, tâches cron, schémas Bronze
│   ├── movies/                   # films (Silver) : filtres, tris, recherche, recommandations
│   ├── lists/                    # à l'affiche, bientôt, tendances (Silver)
│   ├── stats/                    # lecture des collections Gold
│   ├── users/                    # comptes utilisateurs
│   ├── watchlist/                # « Ma liste »
│   ├── pipeline/                 # exécution du Python, suivi pipeline_runs
│   ├── auth/                     # à venir : inscription, connexion, JWT, guards de rôles
│   └── admin/                    # à venir : routes réservées à l'administrateur
├── test/                         # tests e2e (Jest + Supertest)
├── package.json
├── Dockerfile                    # image Node + Python
├── pipeline/                     # Traitement Python
│   ├── clean.py                  # Bronze → Silver
│   ├── gold.py                   # Silver → Gold
│   ├── recommend.py              # recommandations (TF-IDF + similarité cosinus)
│   ├── evaluate.py               # validation du modèle
│   ├── run.py                    # point d'entrée appelé par NestJS
│   └── requirements.txt
├── scripts/
│   └── import_initial.ts         # import initial des films dans Bronze
├── notebooks/
│   └── eda.ipynb                 # analyse exploratoire (EDA)
├── client/                       # Application React + Vite + Chart.js
│   ├── src/
│   │   ├── pages/                # Accueil, Catalogue, Film, Ma liste, Stats, Admin
│   │   ├── components/
│   │   ├── services/             # appels à l'API
│   │   └── main.tsx
│   └── package.json
├── tests/
│   └── load/                     # scripts de tests de charge k6
├── docs/
│   ├── postman/                  # collection Postman
│   ├── rapport-projet.md
│   └── rapport-analyse.md
├── .github/workflows/ci.yml      # CI/CD : tests avant chaque déploiement
├── .env.example
└── README.md
```

---

## 6. Modèle de données MongoDB

### Bronze

**`movies_bronze`** — un document par film, brut (compte pour le seuil des 100 000)
```json
{
  "_id": 123456,
  "raw": { "...": "réponse TMDB (détails + credits + keywords + release_dates)" },
  "fetchedAt": "2026-11-20T03:00:00Z",
  "runId": "6740f1..."
}
```

**`daily_lists_bronze`** — pages brutes des listes du jour (`now_playing`, `upcoming`, `trending`)
```json
{ "list": "now_playing", "date": "2026-11-20", "region": "CA", "page": 1, "raw": { "...": "réponse TMDB" } }
```

### Silver

**`movies_silver`** — film nettoyé
```json
{
  "_id": 123456,
  "title": "Un film",
  "releaseDate": "2019-05-10T00:00:00Z",
  "year": 2019,
  "decade": 2010,
  "runtime": 112,
  "genres": ["Drama", "Crime"],
  "keywords": ["heist", "betrayal"],
  "director": "Nom Réalisateur",
  "cast": ["Acteur 1", "Acteur 2", "Acteur 3", "Acteur 4", "Acteur 5"],
  "certificationCA": "13+",
  "language": "en",
  "budget": 20000000,
  "revenue": 85000000,
  "roi": 4.25,
  "voteAverage": 7.4,
  "voteCount": 3200,
  "popularity": 25.1,
  "posterPath": "/abc.jpg",
  "recommendations": [550, 680, 13],
  "isManual": false,
  "updatedAt": "2026-11-20T03:12:00Z"
}
```

**`daily_lists_silver`** — une ligne par film, par jour et par liste
```json
{ "movieId": 123456, "date": "2026-11-20", "list": "now_playing", "rank": 4 }
```

### Gold

| Collection | Contenu | Champs |
|---|---|---|
| `gold_kpis` | Nombre de films, note moyenne, genre le plus populaire, films à l'affiche, date de mise à jour | `totalMovies`, `averageRating`, `topGenre`, `nowPlayingCount`, `updatedAt` |
| `gold_genres` | Par genre : note moyenne, médiane, nombre de films, popularité | `genre`, `averageRating`, `medianRating`, `movieCount`, `averagePopularity` |
| `gold_roi` | Rentabilité médiane par genre et par tranche de budget | `genre`, `budgetBracket`, `movieCount`, `medianRoi` |
| `gold_decades` | Par décennie : nombre de films, durée moyenne, note moyenne | `decade`, `movieCount`, `averageRuntime`, `averageRating` |
| `gold_now_playing` | Films à l'affiche aujourd'hui + nombre de jours à l'affiche | `movieId`, `title`, `posterPath`, `daysInTheaters`, `rank` |
| `gold_trending` | Tendances du jour + films restés le plus longtemps en tendance | `movieId`, `title`, `posterPath`, `daysTrending`, `rankToday` |

### Gestion

| Collection | Contenu |
|---|---|
| `users` | `email`, `passwordHash` (bcrypt, jamais renvoyé), `role` (`user` / `admin`), `createdAt` |
| `watchlists` | `userId` (référence), `movieIds` (liste d'ID de films), `updatedAt` |
| `pipeline_runs` | `startedAt`, `endedAt`, `trigger` (`cron` / `manual`), `status` (`running` / `success` / `failed`), `counts` (`fetched`, `inserted`, `updated`, `rejected`), `errorMessages` |

### Documents imbriqués ou références

| Donnée | Choix | Pourquoi |
|---|---|---|
| Genres, mots-clés, 5 acteurs, réalisateur, recommandations dans `movies_silver` | **Imbriqués** | Petites listes (quelques dizaines de valeurs au plus), toujours lues avec le film. On évite une jointure à chaque affichage de fiche, et un index multi-clé sur `genres` suffit pour filtrer. |
| `watchlists.userId` → `users` | **Référence** | Un utilisateur et sa liste évoluent séparément ; on ne veut pas relire ou réécrire le compte à chaque ajout de film. |
| `watchlists.movieIds` → `movies_silver` | **Références** (liste d'ID) | Un même film peut être dans des milliers de listes : le copier gonflerait la base et le rendrait vite périmé. |
| `daily_lists_silver.movieId` → `movies_silver` | **Référence** | La collection grossit chaque jour (un document par film, par jour et par liste) ; imbriquer l'historique dans le film ferait grossir chaque film sans limite. |
| `movies_bronze.runId` → `pipeline_runs` | **Référence** | Permet de retrouver ce qu'une exécution a collecté sans dupliquer ses statistiques. |

La connexion est configurée dans `src/app.module.ts` (`MongooseModule.forRootAsync`, URI lue depuis `MONGODB_URI` par `src/config/database.config.ts`). La configuration est validée avec Joi : l'application refuse de démarrer si `MONGODB_URI` est absente. Chaque schéma se trouve dans le dossier `schemas/` du module qui l'utilise (par exemple `src/movies/schemas/movie-silver.schema.ts`).

### Index

| Collection | Index |
|---|---|
| `movies_bronze` | `runId`, `fetchedAt` |
| `daily_lists_bronze` | Unique `{ list, date, region, page }` |
| `movies_silver` | `genres`, `year`, `language`, `voteAverage`, `runtime`, `popularity`, texte sur `title` |
| `daily_lists_silver` | Unique `{ movieId, date, list }`, `date` |
| `gold_genres` / `gold_decades` | Unique `genre` / unique `decade` |
| `gold_roi` | Unique `{ genre, budgetBracket }` |
| `gold_now_playing` / `gold_trending` | Unique `movieId` |
| `watchlists` | Unique `userId` |
| `users` | Unique `email` |
| `pipeline_runs` | `startedAt` |

---

## 7. Pipeline Bronze → Silver → Gold

### Bronze → Silver (`clean.py`)

| Problème dans les données brutes | Traitement |
|---|---|
| `budget`, `revenue` ou `runtime` à 0 | Remplacés par `null` (inconnu) |
| `release_date` vide | `null` ; `year` et `decade` calculés seulement si la date existe |
| Budgets aberrants (ex. 1 $ ou 100 $) | Conservés seulement au-dessus de 1 000 $ |
| Notes peu fiables (ex. 10/10 avec 1 vote) | Exclues des analyses de notes si `vote_count` < 50 |
| Films non sortis (`Rumored`, `Planned`) | Exclus des analyses, conservés en Bronze |
| Genres et mots-clés en objets `{id, name}` | Réduits à une liste de noms |
| Distribution complète (dizaines de personnes) | 5 premiers acteurs + réalisateur |
| Dates de sortie de tous les pays | Canada seulement (date + classement) |
| Durées aberrantes | Conservées entre 40 et 300 minutes |
| Films mis à jour plusieurs fois | Upsert par ID, aucun doublon |
| Film présent plusieurs jours dans une liste | Une ligne par `movieId + date + list` |

### Silver → Gold (`gold.py`)
Agrégations pandas et NumPy (moyennes, médianes, comptages, rentabilité, corrélations), écrites dans les collections `gold_*`. Le client ne reçoit que ces résultats agrégés.

### Exécution
NestJS lance `pipeline/run.py` avec `child_process`. Le script :
1. lit Bronze ;
2. écrit Silver ;
3. calcule Gold et les recommandations ;
4. renvoie un résumé JSON (compteurs, durée, erreurs), enregistré dans `pipeline_runs`.

En cas d'erreur, le statut passe à `failed` avec le message, sans arrêter l'API.

---

## 8. Questions d'analyse

### Q1 — Quels genres ont les meilleures notes et la plus grande popularité ?
- **Données** : genres, `voteAverage`, `voteCount`, `popularity`.
- **Méthode** : `explode` des genres (pandas), films avec au moins 50 votes, moyenne et médiane par genre.
- **Résultat attendu** : classement des genres.
- **Décision** : aider l'utilisateur à choisir un genre ; alimente le graphique « Note par genre ».

### Q2 — Un gros budget rapporte-t-il plus, et dans quel genre ?
- **Données** : `budget`, `revenue`, genres (films avec les deux valeurs connues).
- **Méthode** : rentabilité = recettes ÷ budget (NumPy), médiane par genre et par tranche de budget (< 10 M$, 10–50 M$, > 50 M$).
- **Résultat attendu** : genres et tranches les plus rentables.
- **Décision** : montrer quels types de films sont les moins risqués.

### Q3 — Quels films restent le plus longtemps à l'affiche et dans les tendances ?
Calculé à partir des captures quotidiennes de `now_playing` et `trending`.

### Q4 — Comment le nombre de films, leur durée et leur note évoluent-ils par décennie ?

L'exploration détaillée est dans `notebooks/eda.ipynb`. Le service ne dépend pas du notebook.

---

## 9. Recommandations (apprentissage machine)

| Étape | Détail |
|---|---|
| Objectif | Pour chaque film, trouver les 10 films les plus semblables (« Tu aimeras aussi ») |
| Modèle | Recommandation par contenu : texte = genres + mots-clés + réalisateur + acteurs → **TF-IDF** → **similarité cosinus** (scikit-learn) |
| Périmètre | Films avec au moins 50 votes |
| Validation | Sur 200 films populaires : précision@10 en comparant avec `/movie/{id}/recommendations` de TMDB, et comparaison avec un modèle de base (même genre seulement) |
| Interprétation | Explication des recommandations (genres et mots-clés en commun) et limites (films avec peu de mots-clés) |
| Utilisation | Résultat écrit dans `movies_silver.recommendations`, servi par `GET /movies/:id/recommendations` et affiché sur la fiche du film |

---

## 10. Déclenchement automatique

| Élément | Valeur |
|---|---|
| Mode | **Périodique** (tâche cron NestJS, `@nestjs/schedule`) |
| Fréquence | Chaque nuit à 3 h (heure de Montréal) |
| Étapes | 1. `/movie/changes` → mise à jour de Bronze<br>2. `now_playing`, `upcoming`, `trending` → captures du jour<br>3. Pipeline Python → Silver, Gold, recommandations<br>4. Enregistrement dans `pipeline_runs` |
| Lancement manuel | `POST /api/v1/admin/pipeline/run` (bouton du tableau admin) |
| En cas d'échec | Statut `failed`, message affiché dans le tableau admin, nouvelle tentative la nuit suivante |

### Import initial (une seule fois)
```bash
npm run import:initial
```
Télécharge la liste des ID, sélectionne 150 000 films non adultes et enregistre leur détail dans `movies_bronze` (environ 2 h, avec reprise automatique sur erreur 429).

---

## 11. API REST

- **Base** : `/api/v1`
- **Documentation interactive** : `/docs` (Swagger UI), document OpenAPI en JSON sur `/docs/openapi.json`
- **Collection Postman** : `docs/postman/`

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Créer un compte |
| POST | `/auth/login` | public | Obtenir un jeton JWT |
| GET | `/movies` | user | Catalogue paginé, filtré et trié |
| GET | `/movies/search?q=` | user | Recherche par titre |
| GET | `/movies/:id` | user | Détail d'un film |
| GET | `/movies/:id/recommendations` | user | Recommandations de notre modèle |
| POST | `/movies` | admin | Ajouter un film |
| PATCH | `/movies/:id` | admin | Modifier un film |
| DELETE | `/movies/:id` | admin | Supprimer un film |
| GET | `/lists/now-playing` | user | Films à l'affiche au Canada |
| GET | `/lists/upcoming` | user | Films à venir |
| GET | `/lists/trending` | user | Tendances du jour |
| GET | `/stats/kpis` | user | Indicateurs |
| GET | `/stats/genres` | user | Notes par genre |
| GET | `/stats/roi` | user | Rentabilité |
| GET | `/stats/decades` | user | Évolution par décennie |
| GET | `/me/watchlist` | user | Voir « Ma liste » |
| POST | `/me/watchlist/:movieId` | user | Ajouter un film |
| DELETE | `/me/watchlist/:movieId` | user | Retirer un film |
| POST | `/admin/pipeline/run` | admin | Lancer collecte + traitement |
| GET | `/admin/pipeline/runs` | admin | Historique des exécutions |
| GET | `/admin/stats` | admin | Indicateurs de fonctionnement |

### Paramètres de `GET /movies`
`genre`, `year`, `language`, `minRating`, `minRuntime`, `maxRuntime`, `sort` (`popularity`, `rating`, `releaseDate`, `title`, `revenue`), `order` (`asc` / `desc`), `page`, `limit` (max 50).

### Exemple
```http
GET /api/v1/movies?genre=Drama&minRating=7&sort=rating&order=desc&page=1&limit=20
Authorization: Bearer <jeton>
```
```json
{
  "data": [ { "id": 278, "title": "...", "year": 1994, "voteAverage": 8.7 } ],
  "page": 1,
  "limit": 20,
  "total": 4821,
  "updatedAt": "2026-11-20T03:12:00Z"
}
```

### Codes de statut
| Code | Signification |
|---|---|
| 200 / 201 / 204 | Succès / créé / supprimé |
| 400 | Données invalides |
| 401 | Jeton manquant ou invalide |
| 403 | Rôle insuffisant |
| 404 | Ressource introuvable |
| 409 | Conflit (ex. email déjà utilisé) |
| 429 | Trop de requêtes |
| 500 | Erreur serveur (message générique, détail dans les logs) |

Format d'erreur : Problem Details (`Content-Type: application/problem+json`). Le champ `errors` n'apparaît que pour les erreurs de validation.
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Les données envoyées sont invalides.",
  "instance": "/api/v1/movies",
  "errors": ["minRating must be a number"]
}
```

---

## 12. Sécurité

- **Authentification JWT** sur toutes les routes qui modifient la base.
- **Deux rôles** (`user`, `admin`) vérifiés côté serveur par un guard.
- **Mots de passe** hachés avec bcrypt.
- **Validation des entrées** : `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) et DTO `class-validator`.
- **Injection NoSQL** : refus des opérateurs MongoDB (`$gt`, `$ne`…) dans les paramètres.
- **Limitation de débit** : `@nestjs/throttler`, plus stricte sur `/auth/login`.
- **En-têtes de sécurité** : `helmet` ; **CORS** limité au domaine du client.
- **MongoDB Atlas** : utilisateur dédié aux droits limités, liste d'adresses IP autorisées.
- **HTTPS** obligatoire en production.
- **Secrets** (jeton TMDB, `JWT_SECRET`, URI MongoDB) uniquement dans les variables d'environnement, jamais dans Git ni dans le client.
- **Journalisation** des opérations et des échecs, sans mot de passe, jeton ni secret.

---

## 13. Application cliente

React + Vite + Chart.js, qui consomme uniquement notre API (jamais TMDB directement).

| Page | Contenu |
|---|---|
| Accueil | À l'affiche au Canada, tendances du jour, bientôt en salle |
| Catalogue | Filtres, tri, tableau paginé, date de mise à jour |
| Fiche film | Détails, affiche, distribution, « Tu aimeras aussi », bouton « Ajouter à ma liste » |
| Ma liste | Films gardés par l'utilisateur |
| Statistiques | Indicateurs : nombre de films, note moyenne, genre le plus populaire<br>Graphiques : note par genre, rentabilité par genre, évolution par décennie |
| Admin | Bouton « Lancer », statut du dernier run<br>Indicateurs : dernière exécution, films dans Bronze, taux d'échec<br>Graphiques : films mis à jour par jour, durée du pipeline, erreurs par exécution<br>Gestion des films |

---

## 14. Installation et configuration

### Prérequis
- Node.js 20+
- Python 3.11+
- Un cluster MongoDB Atlas (ou MongoDB local)
- Un jeton d'API TMDB

### Variables d'environnement (`.env.example`)

Utilisées aujourd'hui et présentes dans `.env.example` (validées au démarrage avec Joi) :
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=
```
`MONGODB_URI` est obligatoire ; `PORT` vaut `3000` par défaut et `NODE_ENV` vaut `development` par défaut (`development`, `production` ou `test`).

Prévues, pas encore utilisées par le code ni présentes dans `.env.example` :
```env
# Général
CLIENT_URL=http://localhost:5173

# Sécurité
JWT_SECRET=
JWT_EXPIRES_IN=1h

# TMDB
TMDB_READ_TOKEN=
TMDB_REGION=CA
TMDB_LANGUAGE=fr-CA

# Collecte et pipeline
CRON_SCHEDULE=0 3 * * *
PYTHON_PATH=python3
IMPORT_TARGET=150000
```

### Installation
```bash
# API
npm install

# Pipeline Python
cd pipeline
pip install -r requirements.txt

# Client
cd ../client
npm install
```

### Lancement en développement
```bash
# API (http://localhost:3000, Swagger sur /docs)
npm run start:dev

# Client (http://localhost:5173)
cd client && npm run dev

# Pipeline à la main
cd pipeline && python run.py
```

### Environnements
| Environnement | Fichier | Base |
|---|---|---|
| Développement | `.env.development` | Base de développement |
| Test | `.env.test` | Base de test (vidée avant les tests) |
| Production | Variables de l'hébergeur | Base de production |

---

## 15. Tests

| Type | Outil | Commande |
|---|---|---|
| Unitaires et e2e (fonctionnels + sécurité) | Jest + Supertest | `npm run test` / `npm run test:e2e` |
| Couverture (≥ 70 % du code serveur) | Jest | `npm run test:cov` |
| Charge | k6 | `k6 run tests/load/movies.js` |
| Routes | Postman | `docs/postman/BookMyMovie.postman_collection.json` |

Scénarios de sécurité testés : route admin sans jeton (401), avec un jeton user (403), entrée invalide (400), tentative d'injection NoSQL (400), trop de requêtes (429).

---

## 16. Déploiement

| Composant | Hébergement |
|---|---|
| Base de données | MongoDB Atlas |
| API + pipeline Python | Render ou Railway (Dockerfile Node + Python), HTTPS inclus |
| Client | Vercel ou Netlify, HTTPS inclus |
| CI/CD | GitHub Actions : tests à chaque push, déploiement seulement si les tests passent |

### Lancement en production
```bash
npm run build
npm run start:prod
```

**URL de l'API** : _à compléter_
**URL du client** : _à compléter_

---

## 17. Limites et biais

- Données remplies par la communauté TMDB : erreurs et valeurs manquantes possibles.
- Beaucoup de budgets et de recettes inconnus : la question Q2 porte sur un sous-ensemble.
- Surreprésentation des films américains populaires.
- Notes provenant seulement des utilisateurs de TMDB.
- Les analyses sur l'affiche et les tendances dépendent du nombre de jours de collecte.
- Limite de 512 Mo du plan gratuit d'Atlas : volume fixé à 150 000 films.

---

## 18. Feuille de route

### Sprint 1 — Base du projet et données
- [ ] Validation du sujet et de la définition d'une observation
- [ ] Dépôt, GitHub Projects, branches
- [ ] Jeton TMDB et tests d'appels
- [x] MongoDB Atlas, utilisateur limité, `.env.example`
- [ ] Import initial des films dans Bronze
- [ ] Squelette NestJS (`/api/v1`, Swagger)
- [ ] Squelette React

### Sprint 2 — Nettoyage et API
- [ ] `clean.py` (Bronze → Silver)
- [ ] `gold.py` (Silver → Gold)
- [ ] Notebook EDA
- [ ] Authentification JWT et rôles
- [ ] CRUD des films (filtres, tris, pagination, recherche)
- [ ] Routes `/stats` et `/lists`
- [ ] Index MongoDB

### Sprint 3 — Automatisation, recommandations et site
- [ ] Cron de chaque nuit
- [ ] Exécution du Python depuis NestJS + `pipeline_runs`
- [ ] `recommend.py` + route de recommandations
- [ ] Routes admin et « Ma liste »
- [ ] Pages utilisateur et graphiques
- [ ] Tableau admin
- [ ] Sécurité (throttler, helmet, CORS, validation, injection NoSQL)
- [ ] Tests Jest fonctionnels et de sécurité

### Sprint 4 — Validation, déploiement et remise
- [ ] `evaluate.py` (validation du modèle)
- [ ] Dockerfile et déploiement HTTPS
- [ ] GitHub Actions
- [ ] Tests de charge k6 + rapport
- [ ] Collection Postman et Swagger complets
- [ ] Rapport de projet, rapport d'analyse, présentation
- [ ] Vidéo de démo client et vidéo technique

---

## 19. Crédits et licence des données

Ce projet utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
Données fournies par [The Movie Database (TMDB)](https://www.themoviedb.org/), pour un usage non commercial.

Projet scolaire réalisé dans le cadre du cours 420-514 au Cégep Marie-Victorin.
