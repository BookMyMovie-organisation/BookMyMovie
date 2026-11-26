# Contrat REST – MovieAnalytics API

> **Statut : v0.3** (alignée sur le notebook d'EDA `ProjetMovie.ipynb`) – à valider avec l'équipe et l'enseignante.
> Source des données : **The Movie Database (TMDB)**. Ce produit utilise l'API TMDB, mais n'est ni approuvé ni certifié par TMDB.

## 1. Conventions générales

| Élément | Règle |
|---|---|
| URL de base | `/api/v1` (préfixe global `api` + versionnage URI, `defaultVersion: '1'`) |
| Format | JSON (`application/json`) |
| Erreurs | Problem Details (`application/problem+json`) : `type`, `title`, `status`, `detail`, `instance` (+ `errors` pour la validation) |
| Nommage | Ressources au **pluriel**, en **anglais**, en minuscules avec tirets (`kebab-case`). La méthode HTTP exprime l'action, le chemin identifie la ressource (aucun verbe dans le chemin). |
| Identifiants | `movies` : `tmdbId` (entier, identifiant TMDB unique). `pipeline/runs` et `users` : `id` MongoDB (ObjectId). |
| Dates | ISO 8601 en UTC (`2026-11-23T06:00:00.000Z`) |
| Authentification | JWT dans l'en-tête `Authorization: Bearer <token>` |
| Rôles | `user`, `admin` |
| Documentation | Swagger UI sur `/docs`, OpenAPI JSON sur `/docs/openapi.json` |

### 1.1 Pagination (toutes les listes)

| Paramètre | Type | Défaut | Règle |
|---|---|---|---|
| `page` | entier | `1` | ≥ 1 |
| `limit` | entier | `20` | entre 1 et 100 |

Format de réponse paginée :

```json
{
  "data": [ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 104532,
    "totalPages": 5227
  }
}
```

La pagination, les filtres et les agrégations sont **toujours faits côté serveur** ou dans le pipeline (énoncé 4.1 : le client ne reçoit jamais les 100 000 entrées).

### 1.2 Codes de statut utilisés

| Code | Utilisation |
|---|---|
| `200 OK` | Lecture ou modification réussie |
| `201 Created` | Création réussie (ressource créée dans le corps) |
| `202 Accepted` | Traitement accepté, exécuté en arrière-plan (lancement du pipeline) |
| `204 No Content` | Suppression réussie (aucun corps) |
| `400 Bad Request` | Données ou paramètres invalides (ValidationPipe) |
| `401 Unauthorized` | Jeton JWT absent, invalide ou expiré |
| `403 Forbidden` | Jeton valide, mais rôle insuffisant |
| `404 Not Found` | Ressource introuvable |
| `409 Conflict` | Conflit avec l'état actuel (doublon, exécution du pipeline déjà en cours) |
| `429 Too Many Requests` | Limite de taux dépassée |
| `500 Internal Server Error` | Erreur inattendue (détails seulement dans les journaux serveur) |

### 1.3 Accès

| Symbole | Signification |
|---|---|
| 🌐 | Public (aucun jeton) |
| 👤 | Utilisateur connecté (`user` ou `admin`) |
| 🔒 | Administrateur seulement (`admin`) |

Règle de l'énoncé (4.3) : **toute requête qui modifie la base de données exige un JWT**. Les autorisations sont vérifiées **côté serveur** (guards NestJS).

---

## 2. Health

| Méthode | Route | Accès | Description | Succès | Erreurs |
|---|---|---|---|---|---|
| GET | `/health` | 🌐 | État du service | 200 | 500 |

```json
{ "status": "ok", "service": "movieanalytics-api", "timestamp": "2026-11-23T21:38:00.000Z" }
```

---

## 3. Auth et utilisateurs

| Méthode | Route | Accès | Description | Succès | Erreurs |
|---|---|---|---|---|---|
| POST | `/users` | 🌐 | Créer un compte (rôle `user` par défaut) | 201 | 400, 409 (courriel déjà utilisé) |
| POST | `/auth/tokens` | 🌐 | Se connecter : obtenir un JWT | 201 | 400, 401 |
| GET | `/users/me` | 👤 | Profil de l'utilisateur connecté | 200 | 401 |

`POST /users` :
```json
{ "email": "diego@example.com", "password": "MotDePasse123!", "displayName": "Diego" }
```

`POST /auth/tokens` :
```json
{ "email": "diego@example.com", "password": "MotDePasse123!" }
```
Réponse `201` :
```json
{ "accessToken": "eyJhbGciOi...", "tokenType": "Bearer", "expiresIn": 3600 }
```

Le mot de passe est stocké haché et n'est **jamais** renvoyé. Le rôle `admin` ne peut pas être choisi à l'inscription (champ refusé par `forbidNonWhitelisted`).

---

## 4. Movies (catalogue – couche Silver)

| Méthode | Route | Accès | Description | Succès | Erreurs |
|---|---|---|---|---|---|
| GET | `/movies` | 🌐 | Lister les films (paginé + filtres + tri) | 200 | 400 |
| GET | `/movies/{tmdbId}` | 🌐 | Détail d'un film | 200 | 400, 404 |
| POST | `/movies` | 🔒 | Ajouter un film manuellement | 201 | 400, 401, 403, 409 (tmdbId déjà présent) |
| PATCH | `/movies/{tmdbId}` | 🔒 | Corriger un film (partiel) | 200 | 400, 401, 403, 404 |
| DELETE | `/movies/{tmdbId}` | 🔒 | Supprimer un film | 204 | 401, 403, 404 |

Filtres de `GET /movies` (en plus de `page` et `limit`) :

| Paramètre | Exemple | Description |
|---|---|---|
| `q` | `q=inception` | Recherche dans le titre |
| `genre` | `genre=Drame` | Nom du genre (en français, tel que fourni par TMDB avec `language=fr-CA`) |
| `language` | `language=fr` | Langue originale (code ISO 639-1) |
| `year` | `year=2010` | Année de sortie |
| `minRating` | `minRating=7` | Note moyenne minimale (0 à 10) |
| `minVotes` | `minVotes=100` | Nombre minimal de votes |
| `sort` | `sort=-popularity` | Tri : `popularity`, `voteAverage`, `voteCount`, `releaseDate` (préfixe `-` = décroissant) |

Film (réponse de `GET /movies/{tmdbId}`) – champs issus de la couche Silver du notebook :
```json
{
  "tmdbId": 1726,
  "title": "Iron Man",
  "originalTitle": "Iron Man",
  "originalLanguage": "en",
  "overview": "Iron Man, alias Tony Stark, est un jeune milliardaire...",
  "releaseDate": "2008-04-30",
  "releaseYear": 2008,
  "genreIds": [28, 878, 12],
  "genres": ["Action", "Science-Fiction", "Aventure"],
  "popularity": 2291.4426,
  "voteAverage": 7.669,
  "voteCount": 29254,
  "hasVotes": true,
  "posterPath": "/uZrsDJkn0PPnGc51fQhtCqwPPVM.jpg",
  "backdropPath": "/cKvDv2LpwVEqbdXWoQl4XgGN6le.jpg",
  "updatedAt": "2026-11-23T06:00:00.000Z"
}
```

Correspondance avec les champs TMDB (Bronze → Silver) :

| TMDB (Bronze) | API (Silver) | Transformation (notebook) |
|---|---|---|
| `id` | `tmdbId` | Clé d'unicité; doublons supprimés (`drop_duplicates(subset=["id"])`) |
| `title`, `original_title` | `title`, `originalTitle` | `title` en français (`language=fr-CA`) |
| `original_language` | `originalLanguage` | – |
| `overview` | `overview` | Peut être vide (texte non traduit) |
| `release_date` | `releaseDate`, `releaseYear` | `pd.to_datetime(errors="coerce")` puis `.dt.year`; date invalide → `null` |
| `genre_ids` | `genreIds`, `genres` | Noms obtenus avec `GET /genre/movie/list` (`fr-CA`); identifiant inconnu → `"Inconnu"` |
| `popularity` | `popularity` | – |
| `vote_average`, `vote_count` | `voteAverage`, `voteCount`, `hasVotes` | `hasVotes = vote_count > 0` |
| `poster_path`, `backdrop_path` | `posterPath`, `backdropPath` | `backdrop_path` peut être manquant → `null` |
| `adult`, `video`, `softcore` | – | Non exposés; films `adult = true` exclus à la collecte |

La réponse paginée de `GET /movies` ajoute la date de mise à jour du catalogue dans `meta` (exigence 2.3 – tableau paginé avec date de mise à jour) :
```json
"meta": { "page": 1, "limit": 20, "total": 104532, "totalPages": 5227, "updatedAt": "2026-11-23T06:00:00.000Z" }
```

> Énoncé 3.1 : quand un film est modifié ou supprimé, l'administrateur peut relancer le traitement (`POST /pipeline/runs` avec `type: "process"`) pour actualiser les résultats Gold utilisés par les tableaux de bord.

---

## 5. Analytics (résultats Gold – tableau de bord utilisateur)

Toutes les routes lisent des collections **Gold précalculées** par le pipeline Python (pandas / NumPy). Toutes les réponses incluent :
- `updatedAt` : date de la dernière production Gold (exigence 2.3 : « date de mise à jour des données »);
- `parameters` : les seuils réellement appliqués (transparence sur les biais et limites, exigence 3.4).

### 5.1 Indicateurs (KPI)

| Méthode | Route | Accès | Description | Succès | Erreurs |
|---|---|---|---|---|---|
| GET | `/analytics/kpis` | 🌐 | Indicateurs métier du tableau de bord utilisateur | 200 | 500 |

```json
{
  "updatedAt": "2026-11-23T06:00:00.000Z",
  "data": {
    "totalMovies": 104532,
    "ratedMovies": 38210,
    "averageRating": 6.3,
    "mostRepresentedGenre": "Action",
    "topRatedLanguage": "ja"
  }
}
```

### 5.2 Q1 – Quels genres de films sont les plus représentés ?

| Méthode | Route | Accès | Filtres | Graphique |
|---|---|---|---|---|
| GET | `/analytics/genre-distribution` | 🌐 | `fromYear`, `toYear`, `language` | Diagramme en barres |

```json
{
  "updatedAt": "2026-11-23T06:00:00.000Z",
  "parameters": { "fromYear": 1990, "toYear": 2026, "language": null },
  "data": [
    { "genre": "Action", "movieCount": 31250, "share": 0.299 },
    { "genre": "Aventure", "movieCount": 21480, "share": 0.205 }
  ]
}
```
`share` = proportion des films du catalogue filtré qui ont ce genre. Un film peut avoir plusieurs genres : la somme des `share` peut dépasser 1.

### 5.3 Q2 – Dans quelles langues originales trouve-t-on le plus de films bien notés ?

| Méthode | Route | Accès | Filtres | Graphique |
|---|---|---|---|---|
| GET | `/analytics/top-rated-languages` | 🌐 | `minVotes` (défaut 100), `minRating` (défaut 7), `limit` (défaut 10, max 30) | Barres par langue |

```json
{
  "updatedAt": "2026-11-23T06:00:00.000Z",
  "parameters": { "minVotes": 100, "minRating": 7, "limit": 10 },
  "data": [
    { "language": "en", "highlyRatedCount": 4120, "eligibleCount": 18900, "highlyRatedShare": 0.218 },
    { "language": "ja", "highlyRatedCount": 610, "eligibleCount": 1450, "highlyRatedShare": 0.421 }
  ]
}
```
- « Bien noté » = `voteAverage ≥ minRating` **et** `voteCount ≥ minVotes`.
- `eligibleCount` = films de la langue qui ont au moins `minVotes` votes.
- On affiche le **nombre** et la **proportion**, pour ne pas favoriser l'anglais seulement parce qu'il est surreprésenté.

### 5.4 Q3 – Quels genres obtiennent les meilleures notes moyennes ?

| Méthode | Route | Accès | Filtres | Graphique |
|---|---|---|---|---|
| GET | `/analytics/genre-ratings` | 🌐 | `minVotes` (défaut 100) | Diagramme en barres comparatif |

```json
{
  "updatedAt": "2026-11-23T06:00:00.000Z",
  "parameters": { "minVotes": 100 },
  "data": [
    { "genre": "Animation", "averageRating": 7.1, "movieCount": 2310, "totalVotes": 1250000 },
    { "genre": "Horreur", "averageRating": 5.9, "movieCount": 3980, "totalVotes": 2100000 }
  ]
}
```
Les films **sans votes** sont exclus, ainsi que ceux sous le seuil `minVotes` (notes peu fiables).

### 5.5 Q4 – Existe-t-il une relation entre la popularité et la note moyenne ?

| Méthode | Route | Accès | Filtres | Graphique |
|---|---|---|---|---|
| GET | `/analytics/popularity-rating` | 🌐 | `minVotes` (défaut 100), `genre`, `sampleSize` (défaut 500, max 2000) | Nuage de points |

```json
{
  "updatedAt": "2026-11-23T06:00:00.000Z",
  "parameters": { "minVotes": 100, "genre": null, "sampleSize": 500 },
  "correlation": {
    "pearson": 0.21,
    "spearman": 0.34,
    "n": 18900
  },
  "data": [
    { "tmdbId": 1726, "title": "Iron Man", "popularity": 2291.44, "voteAverage": 7.669 }
  ]
}
```
- Le coefficient de corrélation est calculé avec **NumPy** sur **tous** les films éligibles (`n`).
- Le nuage de points reçoit seulement un **échantillon** (`sampleSize`) : envoyer des dizaines de milliers de points au navigateur serait lent et contraire à l'énoncé 4.1.
- `spearman` (corrélation des rangs) est ajouté parce que `popularity` est très asymétrique (quelques films très populaires).

---

## 6. Pipeline (collecte et traitement – tableau de bord administrateur)

| Méthode | Route | Accès | Description | Succès | Erreurs |
|---|---|---|---|---|---|
| POST | `/pipeline/runs` | 🔒 | Lancement manuel de la collecte et/ou du traitement | 202 | 400, 401, 403, 409 (exécution déjà en cours) |
| GET | `/pipeline/runs` | 🔒 | Historique des exécutions (paginé, filtres `status`, `type`, `trigger`) | 200 | 400, 401, 403 |
| GET | `/pipeline/runs/{id}` | 🔒 | Détail d'une exécution | 200 | 400, 401, 403, 404 |
| GET | `/pipeline/stats` | 🔒 | Indicateurs de fonctionnement | 200 | 401, 403 |

`POST /pipeline/runs` :
```json
{ "type": "full" }
```
`type` ∈ `collect` (TMDB → Bronze), `process` (Bronze → Silver → Gold), `full` (les deux).

Réponse `202` :
```json
{
  "id": "6741a3e4c1d2e3f4a5061930",
  "type": "full",
  "trigger": "manual",
  "status": "running",
  "startedAt": "2026-11-23T20:30:00.000Z"
}
```

Détail d'une exécution terminée (`GET /pipeline/runs/{id}`) :
```json
{
  "id": "6741a3e4c1d2e3f4a5061930",
  "type": "full",
  "trigger": "manual",
  "status": "succeeded",
  "startedAt": "2026-11-23T20:30:00.000Z",
  "finishedAt": "2026-11-23T20:41:12.000Z",
  "durationMs": 672000,
  "counts": { "bronzeInserted": 1240, "silverValid": 1198, "silverRejected": 42, "goldCollections": 5 },
  "error": null
}
```

- Statuts : `running` → `succeeded` ou `failed` (avec `error` : message court, sans pile d'appels).
- Le déclenchement automatique (tâche périodique) crée aussi une exécution, avec `"trigger": "scheduled"`.
- `202 Accepted` plutôt que `201` : le traitement est long et continue en arrière-plan; le client suit son avancement avec `GET /pipeline/runs/{id}`.

`GET /pipeline/stats` (indicateurs du tableau de bord administrateur) :
```json
{
  "data": {
    "bronzeCount": 104532,
    "silverCount": 98710,
    "lastRun": { "id": "6741a3e4c1d2e3f4a5061930", "status": "succeeded", "finishedAt": "2026-11-23T20:41:12.000Z" },
    "successRate30d": 0.97,
    "averageDurationMs": 655000,
    "runsPerDay": [ { "date": "2026-11-22", "succeeded": 1, "failed": 0 } ]
  }
}
```

---

## 7. Correspondance avec les tableaux de bord

| Tableau de bord | Exigence | Route(s) |
|---|---|---|
| Utilisateur | 3 indicateurs | `GET /analytics/kpis` |
| Utilisateur | 3 graphiques (questions distinctes) | `GET /analytics/genre-distribution`, `/top-rated-languages`, `/genre-ratings`, `/popularity-rating` |
| Utilisateur | Filtres | paramètres des routes `analytics` et `movies` |
| Utilisateur | Tableau paginé + date de mise à jour | `GET /movies` + `updatedAt` |
| Utilisateur | Consultation détaillée | `GET /movies/{tmdbId}` |
| Admin | Lancement manuel + réussite/échec | `POST /pipeline/runs`, `GET /pipeline/runs/{id}` |
| Admin | 3 indicateurs + 3 graphiques de suivi | `GET /pipeline/stats`, `GET /pipeline/runs` |

---

## 8. Questions ouvertes

1. **Volume de collecte (bloquant)** : le notebook collecte avec `GET /movie/popular`, limité à 500 pages de 20 films (au plus 10 000 films, et seulement 469 distincts sur 500 collectés). Pour atteindre les **100 000 observations distinctes** exigées (énoncé 3.2), la collecte doit passer par `GET /discover/movie` découpé par période de sortie (par exemple année par année), qui renvoie les **mêmes champs** que `/movie/popular`; le contrat ne change pas.
2. **Seuils des questions 2 à 4** (`minVotes`, `minRating`) : pas encore étudiés dans le notebook (seule la question 1 y est réalisée). Les valeurs par défaut `minVotes = 100` et `minRating = 7` sont provisoires.
3. **Filtres sur les routes Gold** : le pipeline doit précalculer les agrégats à une granularité qui permet ces filtres (par exemple genre × année × langue), ou les filtres doivent être réduits.
4. **Opérations métier de l'utilisateur** (énoncé 2.3) : la consultation suffit-elle, ou ajoute-t-on des films favoris (`/users/me/favorites`) ?
5. **Validation par l'enseignante** du contrat complet.
